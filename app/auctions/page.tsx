"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http, zeroAddress } from "viem";
import { auctionAbi, CONTRACTS, CHAIN_META } from "@/lib/contracts";
import { activeChain } from "@/lib/wagmi-config";
import Header from "../components/Header";
import PropertyCard from "../components/PropertyCard";
import { fetchNFTMetadataFull, ipfsToHttp } from "@/lib/metadata";
import type { AuctionMeta } from "@/lib/metadata";
import type { Address } from "viem";

// ============ CONSTANTS ============

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
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<AuctionData[]>([]);

  const publicClient = useMemo(
    () => createPublicClient({ chain: activeChain, transport: http(CHAIN_META.rpcDefault) }),
    []
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todas");
  const [search, setSearch] = useState("");

  const fetchAuctions = useCallback(
    async (signal?: AbortSignal) => {

      setLoading(true);
      try {
        let auctionAddresses: string[] = [];
        try {
          const result = await publicClient.readContract({
            address: CONTRACTS.AuctionFactory,
            abi: FACTORY_READ_ABI,
            functionName: "getAuctions",
          });
          auctionAddresses = [...result] as string[];
        } catch {
          auctionAddresses = [CONTRACTS.AuctionManager];
        }

        // Check if aborted after async operation
        if (signal?.aborted) return;

        // Ensure there are no duplicate addresses (prevents React key warnings)
        const uniqueAuctionAddresses = Array.from(new Set(auctionAddresses));

        const auctionDataPromises = uniqueAuctionAddresses.map(
          async (addr) => {
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
                metadata: metadata as Record<string, unknown>,
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
    [publicClient]
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
    return auctions
      .filter((a) => {
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
      })
      .sort((a, b) => {
        const aActive = !a.finalized && !a.paused ? 0 : 1;
        const bActive = !b.finalized && !b.paused ? 0 : 1;
        return aActive - bActive;
      });
  }, [auctions, statusFilter, search]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-4" />
          <div className="text-lg opacity-80">Cargando subastas...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-6">

        {/* ── Kick live stream ── */}
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-white/10"
          style={{ aspectRatio: "16/9", background: "#0a0a0a" }}
        >
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/70 border border-white/10 px-2.5 py-1 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-bold text-white tracking-wide">LIVE</span>
          </div>
          <iframe
            src="https://player.kick.com/zbricks"
            width="100%"
            height="100%"
            className="block border-none"
            allowFullScreen
            scrolling="no"
          />
        </div>

        {/* ── Filters bar ── */}
        <div className="flex gap-2 flex-wrap items-center">
          <Chip active={statusFilter === "Todas"} onClick={() => setStatusFilter("Todas")}>
            Todas
          </Chip>
          <Chip active={statusFilter === "Activa"} onClick={() => setStatusFilter("Activa")}>
            Activas
          </Chip>
          <Chip active={statusFilter === "Finalizada"} onClick={() => setStatusFilter("Finalizada")}>
            Finalizadas
          </Chip>

          <div className="flex-1" />

          <span className="text-gray-500 text-xs">{filtered.length} subasta{filtered.length !== 1 ? "s" : ""}</span>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
            <span className="text-gray-400 text-xs">Buscar</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Título, dirección..."
              className="bg-transparent border-none outline-none text-white text-sm w-44"
            />
          </div>

          <button
            onClick={() => fetchAuctions()}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition-colors"
          >
            Actualizar
          </button>
        </div>

        {/* ── Auction cards ── */}
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
            <div className="col-span-full p-8 rounded-2xl border border-white/10 bg-white/[0.03] text-gray-400 text-center">
              No se encontraron subastas con los filtros actuales.
            </div>
          )}
        </div>

      </div>
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

