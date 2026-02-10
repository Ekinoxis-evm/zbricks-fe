"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http, formatUnits, zeroAddress } from "viem";
import { baseSepolia, base } from "viem/chains";
import { auctionAbi, houseNftAbi, factoryAbi, getContractsForChain, getChainMeta } from "@/lib/contracts";
import Header from "../components/Header";
import PhaseProgressBar from "../components/PhaseProgressBar";
import PropertyCard from "../components/PropertyCard";
import { fetchNFTMetadataFull, ipfsToHttp } from "@/lib/metadata";
import type { AuctionMeta } from "@/lib/metadata";
import type { Address } from "viem";

// ============ CONSTANTS ============

const CHAIN_MAP: Record<number, typeof baseSepolia> = {
  84532: baseSepolia,
  8453: base,
};

const DEFAULT_RPC_BY_CHAIN: Record<number, string> = {
  84532: "https://sepolia.base.org",
  8453: "https://mainnet.base.org",
};

// Build chain deployments from addresses.json to ensure only allowed chains are available
const CHAIN_DEPLOYMENTS: Record<
  number,
  {
    chainId: number;
    chainName: string;
    explorer: string;
    contracts: {
      HouseNFT: Address;
      AuctionFactory: Address;
      AuctionManager: Address;
    };
    usdc: Address;
  }
> = {
  8453: {
    chainId: 8453,
    chainName: "Base Mainnet",
    explorer: "https://base.blockscout.com",
    contracts: getContractsForChain(8453),
    usdc: getContractsForChain(8453).USDC,
  },
  84532: {
    chainId: 84532,
    chainName: "Base Sepolia",
    explorer: "https://base-sepolia.blockscout.com",
    contracts: getContractsForChain(84532),
    usdc: getContractsForChain(84532).USDC,
  },
};

// Minimal ABIs for auctions reads
const FACTORY_READ_ABI = [
  {
    type: "function" as const,
    name: "getAuctions",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view" as const,
  },
] as const;

const NFT_READ_ABI = [
  {
    type: "function" as const,
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "ownerOf",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view" as const,
  },
] as const;

// ============ TYPES ============

interface AuctionData {
  address: string;
  nftContract: string;
  tokenId: bigint;
  floorPrice: bigint;
  currentPhase: number;
  currentLeader: string;
  currentHighBid: bigint;
  winner: string;
  finalized: boolean;
  paused: boolean;
  timeRemaining: bigint;
  bidderCount: number;
  title?: string;
  location?: string;
  image?: string;
  metadata?: AuctionMeta | null;
}

type StatusFilter = "Todas" | "Activa" | "Finalizada";

// ============ HELPERS ============

const shortAddr = (addr: string) => (addr && addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr || "-");

const formatUsdc = (amount: bigint) => {
  return Number(formatUnits(amount, 6)).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatTimeRemaining = (seconds: bigint) => {
  const s = Number(seconds);
  if (s <= 0) return "Ended";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Fallback image if metadata fails to load
const FALLBACK_IMAGE = "/auctions/ALH_Taller_Edificio_E_Cam_01_2025_06_07.jpg";

// Helper to fetch and parse NFT metadata from tokenURI
const fetchNFTMetadata = async (tokenURI: string) => {
  try {
    const fullMeta = await fetchNFTMetadataFull(tokenURI);
    if (!fullMeta) {
      return {
        title: "Property",
        location: "",
        image: FALLBACK_IMAGE,
        fullMeta: null,
      };
    }
    const image = fullMeta.image ? ipfsToHttp(fullMeta.image) : FALLBACK_IMAGE;
    const cityTrait = fullMeta.attributes?.find((t) => t.trait_type === "City");
    const neighborhoodTrait = fullMeta.attributes?.find((t) => t.trait_type === "Neighborhood");
    const location = [neighborhoodTrait?.value, cityTrait?.value]
      .filter((v) => v && String(v) !== "")
      .join(", ") || fullMeta.description || "";
    return {
      title: fullMeta.name || "Property",
      location,
      image,
      fullMeta,
    };
  } catch (error) {
    console.error("Failed to fetch NFT metadata:", error);
    return {
      title: "Property",
      location: "",
      image: FALLBACK_IMAGE,
      fullMeta: null,
    };
  }
};

// ============ COMPONENT ============

export default function AuctionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<AuctionData[]>([]);

  const [selectedChainId, setSelectedChainId] = useState<number>(84532);
  const chainConfig = CHAIN_DEPLOYMENTS[selectedChainId];

  const rpcUrl = useMemo(() => {
    const envKey = {
      84532: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
      8453: process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL,
    }[selectedChainId];
    return envKey ?? DEFAULT_RPC_BY_CHAIN[selectedChainId];
  }, [selectedChainId]);

  const publicClient = useMemo(() => {
    if (!rpcUrl) return null;
    const chain = CHAIN_MAP[selectedChainId] ?? baseSepolia;
    return createPublicClient({ chain, transport: http(rpcUrl) });
  }, [rpcUrl, selectedChainId]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todas");
  const [search, setSearch] = useState("");

  const fetchAuctions = useCallback(
    async (signal?: AbortSignal) => {
      if (!publicClient) return;

      setLoading(true);
      try {
        let auctionAddresses: string[] = [];
        try {
          const result = await publicClient.readContract({
            address: chainConfig.contracts.AuctionFactory,
            abi: FACTORY_READ_ABI,
            functionName: "getAuctions",
          });
          auctionAddresses = [...result] as string[];
        } catch {
          auctionAddresses = [chainConfig.contracts.AuctionManager];
        }

        // Check if aborted after async operation
        if (signal?.aborted) return;

        if (!auctionAddresses.includes(chainConfig.contracts.AuctionManager)) {
          auctionAddresses = [
            chainConfig.contracts.AuctionManager,
            ...auctionAddresses,
          ];
        }

        const auctionDataPromises = auctionAddresses.map(
          async (addr, index) => {
            try {
              // Check abort before each multicall
              if (signal?.aborted) return null;

              const results = await publicClient.multicall({
                contracts: [
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "nftContract",
                  },
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "tokenId",
                  },
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "floorPrice",
                  },
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "currentPhase",
                  },
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "currentLeader",
                  },
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "currentHighBid",
                  },
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "winner",
                  },
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "finalized",
                  },
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "paused",
                  },
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "getTimeRemaining",
                  },
                  {
                    address: addr as Address,
                    abi: auctionAbi,
                    functionName: "getBidderCount",
                  },
                ],
              });

              const nftContract = (results[0].result as string) ?? zeroAddress;
              const tokenId = (results[1].result as bigint) ?? 0n;

              // Fetch tokenURI to get real NFT metadata
              let metadata = {
                title: `Property #${Number(tokenId)}`,
                location: "",
                image: FALLBACK_IMAGE,
              };

              try {
                const tokenURIResult = await publicClient.readContract({
                  address: nftContract as Address,
                  abi: NFT_READ_ABI,
                  functionName: "tokenURI",
                  args: [tokenId],
                });

                if (tokenURIResult && typeof tokenURIResult === "string") {
                  metadata = await fetchNFTMetadata(tokenURIResult);
                }
              } catch (error) {
                console.warn(`Failed to fetch tokenURI for ${addr}:`, error);
              }

              return {
                address: addr,
                nftContract,
                tokenId,
                floorPrice: (results[2].result as bigint) ?? 0n,
                currentPhase:
                  results[3].result != null ? Number(results[3].result) : 0,
                currentLeader: (results[4].result as string) ?? zeroAddress,
                currentHighBid: (results[5].result as bigint) ?? 0n,
                winner: (results[6].result as string) ?? zeroAddress,
                finalized: (results[7].result as boolean) ?? false,
                paused: (results[8].result as boolean) ?? false,
                timeRemaining: (results[9].result as bigint) ?? 0n,
                bidderCount:
                  results[10].result != null ? Number(results[10].result) : 0,
                title: metadata.title,
                location: metadata.location,
                image: metadata.image,
                metadata: metadata.fullMeta,
              } as AuctionData;
            } catch (error) {
              console.error(`Failed to fetch auction ${addr}:`, error);
              return null;
            }
          }
        );

        const results = await Promise.all(auctionDataPromises);

        // Check if aborted after all promises
        if (signal?.aborted) return;

        const validAuctions = results.filter(
          (a): a is AuctionData => a !== null
        );
        setAuctions(validAuctions);
      } catch (error) {
        if (!signal?.aborted) {
          console.error("Failed to fetch auctions:", error);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [publicClient, chainConfig]
  );

  useEffect(() => {
    const abortController = new AbortController();

    fetchAuctions(abortController.signal);
    const interval = setInterval(() => {
      if (!abortController.signal.aborted) {
        fetchAuctions(abortController.signal);
      }
    }, 30000);

    return () => {
      abortController.abort();
      clearInterval(interval);
    };
  }, [fetchAuctions]);


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return auctions.filter((a) => {
      const isActive = !a.finalized && !a.paused;
      const matchStatus =
        statusFilter === "Todas"
          ? true
          : statusFilter === "Activa"
          ? isActive
          : a.finalized;
      const matchQuery =
        q.length === 0
          ? true
          : `${a.title ?? ""} ${a.location ?? ""} ${a.address}`.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [auctions, statusFilter, search]);

  const activeCount = auctions.filter((a) => !a.finalized && !a.paused).length;
  const finalizedCount = auctions.filter((a) => a.finalized).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-4" />
          <div className="text-lg opacity-80">Loading auctions from {chainConfig.chainName}...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />


      {/* ====== CONTENT ====== */}
      <section className="px-4 py-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex gap-3 flex-wrap items-center mb-5">
            <div className="text-gray-400 text-sm">
              {auctions.length} auctions on-chain
            </div>

            <div className="flex-1" />

            <select
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              value={selectedChainId}
              onChange={(e) => setSelectedChainId(Number(e.target.value))}
            >
              {Object.values(CHAIN_DEPLOYMENTS).map((c) => (
                <option key={c.chainId} value={c.chainId}>
                  {c.chainName}
                </option>
              ))}
            </select>

            <button
              onClick={fetchAuctions}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Refresh
            </button>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-white/[0.03] min-w-[280px]">
              <span className="text-gray-400 text-xs">Search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Address, title..."
                className="flex-1 bg-transparent border-none outline-none text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-[280px_1fr] gap-4 marketLayout">
            <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 h-fit">
              <div className="font-black mb-2.5">Filters</div>
              <div className="text-xs text-gray-400 mb-2">Status</div>
              <div className="flex gap-2 flex-wrap">
                <Chip active={statusFilter === "Todas"} onClick={() => setStatusFilter("Todas")}>
                  All
                </Chip>
                <Chip active={statusFilter === "Activa"} onClick={() => setStatusFilter("Activa")}>
                  Active
                </Chip>
                <Chip active={statusFilter === "Finalizada"} onClick={() => setStatusFilter("Finalizada")}>
                  Ended
                </Chip>
              </div>

              <div className="mt-3.5 pt-3.5 border-t border-white/[0.08]">
                <div className="text-xs text-gray-400 mb-2">Summary</div>
                <div className="grid gap-2">
                  <MiniStat label="Total" value={String(auctions.length)} />
                  <MiniStat label="Active" value={String(activeCount)} />
                  <MiniStat label="Ended" value={String(finalizedCount)} />
                </div>
              </div>

              <div className="mt-3.5 pt-3.5 border-t border-white/[0.08]">
                <div className="text-xs text-gray-400 mb-2">Contracts</div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-white/50 mb-1">Factory</div>
                    <a
                      href={`${chainConfig.explorer}/address/${chainConfig.contracts.AuctionFactory}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {shortAddr(chainConfig.contracts.AuctionFactory)}
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <div>
                    <div className="text-white/50 mb-1">USDC</div>
                    <a
                      href={`${chainConfig.explorer}/address/${chainConfig.usdc}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {shortAddr(chainConfig.usdc)}
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <div>
                    <div className="text-white/50 mb-1">HouseNFT</div>
                    <a
                      href={`${chainConfig.explorer}/address/${chainConfig.contracts.HouseNFT}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {shortAddr(chainConfig.contracts.HouseNFT)}
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 p-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] text-gray-200 text-[13px] leading-tight">
                <b className="text-cyan-400">Tip:</b> Click any property to place a bid on-chain with USDC.
              </div>
            </aside>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
              {filtered.map((auction) => (
                  <Link
                    key={auction.address}
                    href={`/biddings?auction=${auction.address}`}
                    className="block no-underline text-inherit"
                  >
                    <PropertyCard
                      variant="compact"
                      metadata={auction.metadata ?? null}
                      currentPhase={auction.currentPhase}
                      tokenId={auction.tokenId}
                      auctionAddress={auction.address}
                      auctionData={{
                        floorPrice: auction.floorPrice,
                        currentHighBid: auction.currentHighBid,
                        currentLeader: auction.currentLeader,
                        bidderCount: auction.bidderCount,
                        timeRemaining: auction.timeRemaining,
                        finalized: auction.finalized,
                        paused: auction.paused,
                      }}
                      fallbackImage={auction.image || FALLBACK_IMAGE}
                    />
                  </Link>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-gray-400 text-center">
                  No auctions found with the current filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>


      <style jsx>{`
        @media (max-width: 980px) {
          .marketLayout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

/* ======= UI helpers ======= */

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer border px-2.5 py-2 rounded-full font-black text-xs transition-colors ${
        active
          ? "bg-cyan-400/20 border-cyan-400/30 text-cyan-400"
          : "bg-white/[0.03] border-white/[0.12] text-gray-200 hover:bg-white/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-3 py-2.5 rounded-xl border border-white/[0.08] bg-black/25 text-[13px]">
      <span className="text-gray-400">{label}</span>
      <b className="text-white">{value}</b>
    </div>
  );
}
