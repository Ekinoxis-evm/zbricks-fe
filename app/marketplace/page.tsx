"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import Header from "../components/Header";
import PhaseProgressBar from "../components/PhaseProgressBar";

// ============ CONSTANTS ============

const DEFAULT_RPC_BY_CHAIN: Record<number, string> = {
  84532: "https://sepolia.base.org",
  8453: "https://mainnet.base.org",
  5042002: "https://rpc.testnet.arc.network",
};

const CHAIN_DEPLOYMENTS: Record<
  number,
  {
    chainId: number;
    chainName: string;
    explorer: string;
    contracts: {
      HouseNFT: string;
      AuctionFactory: string;
      AuctionManager: string;
    };
    usdc: string;
  }
> = {
  8453: {
    chainId: 8453,
    chainName: "Base Mainnet",
    explorer: "https://base.blockscout.com",
    contracts: {
      HouseNFT: "0x44b659c474d1bcb0e6325ae17c882994d772e471",
      AuctionFactory: "0x1d5854ef9b5fd15e1f477a7d15c94ea0e795d9a5",
      AuctionManager: "0x24220aeb9360aaf896c99060c53332258736e30d",
    },
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  84532: {
    chainId: 84532,
    chainName: "Base Sepolia",
    explorer: "https://base-sepolia.blockscout.com",
    contracts: {
      HouseNFT: "0x3911826c047726de1881f5518faa06e06413aba6",
      AuctionFactory: "0xd13e24354d6e9706b4bc89272e31374ec71a2e75",
      AuctionManager: "0x4aee0c5afe353fb9fa111e0b5221db715b53cb10",
    },
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  5042002: {
    chainId: 5042002,
    chainName: "Arc Testnet",
    explorer: "https://testnet.arcscan.app",
    contracts: {
      HouseNFT: "0x6bb77d0b235d4d27f75ae0e3a4f465bf8ac91c0b",
      AuctionFactory: "0x88cc60b8a6161758b176563c78abeb7495d664d1",
      AuctionManager: "0x2fbaed3a30a53bd61676d9c5f46db5a73f710f53",
    },
    usdc: "0x3600000000000000000000000000000000000000",
  },
};

// ============ ABIs ============

const FACTORY_ABI = [
  "function getAuctions() view returns (address[])",
  "function getAuctionCount() view returns (uint256)",
];

const AUCTION_ABI = [
  "function nftContract() view returns (address)",
  "function tokenId() view returns (uint256)",
  "function floorPrice() view returns (uint256)",
  "function currentPhase() view returns (uint8)",
  "function currentLeader() view returns (address)",
  "function currentHighBid() view returns (uint256)",
  "function winner() view returns (address)",
  "function finalized() view returns (bool)",
  "function paused() view returns (bool)",
  "function getTimeRemaining() view returns (uint256)",
  "function getBidderCount() view returns (uint256)",
];

const NFT_ABI = [
  "function tokenURI(uint256) view returns (string)",
  "function ownerOf(uint256) view returns (address)",
];

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
  // Metadata (optional, from NFT URI)
  title?: string;
  location?: string;
  image?: string;
}

type StatusFilter = "Todas" | "Activa" | "Finalizada";

// ============ HELPERS ============

const shortAddr = (addr: string) => (addr && addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr || "-");

const formatUsdc = (amount: bigint) => {
  return Number(ethers.formatUnits(amount, 6)).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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

// Property images (for demo display when no NFT metadata available)
const PROPERTY_IMAGES = [
  "/marketplace/ALH_Taller_Edificio_E_Cam_01_2025_06_07.jpg",
  "/marketplace/ALH_Taller_Edificio_E_Cam_03_2025_06_07.jpg",
  "/marketplace/ALH_Taller_Edificio_E_Cam_04_2025_06_07.jpg",
  "/marketplace/ALH_Taller_Edificio_E_Cam_05_2025_06_07.jpg",
  "/marketplace/ALH_Taller_Edificio_E_Cam_06_2025_06_07.jpg",
  "/marketplace/AIN2402_AO_TTA_YAV_AV_947_ZonasComunes_04.jpg",
];

const PROPERTY_TITLES = [
  "Modern Family House",
  "Luxurious Villa",
  "Country Cottage",
  "Beachfront Mansion",
  "Suburban House",
  "Mountain Retreat",
];

const PROPERTY_LOCATIONS = [
  "San Francisco, CA",
  "Miami, FL",
  "Denver, CO",
  "Malibu, CA",
  "Seattle, WA",
  "Aspen, CO",
];

// ============ COMPONENT ============

export default function MarketplacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [showStreamCard, setShowStreamCard] = useState(false);
  const [liveExploded, setLiveExploded] = useState(false);

  // Chain selection
  const [selectedChainId, setSelectedChainId] = useState<number>(84532);
  const chainConfig = CHAIN_DEPLOYMENTS[selectedChainId];

  const rpcUrl = useMemo(() => {
    const envKey = {
      84532: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
      8453: process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL,
      5042002: process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL,
    }[selectedChainId];
    return envKey ?? DEFAULT_RPC_BY_CHAIN[selectedChainId];
  }, [selectedChainId]);

  const rpcProvider = useMemo(
    () => (rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : null),
    [rpcUrl]
  );

  // UI state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todas");
  const [search, setSearch] = useState("");

  // Fetch auctions from factory
  const fetchAuctions = useCallback(async () => {
    if (!rpcProvider) return;

    setLoading(true);
    try {
      const factory = new ethers.Contract(chainConfig.contracts.AuctionFactory, FACTORY_ABI, rpcProvider);

      // Get all auction addresses
      let auctionAddresses: string[] = [];
      try {
        auctionAddresses = await factory.getAuctions();
      } catch {
        // If getAuctions fails, try just the default AuctionManager
        auctionAddresses = [chainConfig.contracts.AuctionManager];
      }

      // Always include the default AuctionManager if not in list
      if (!auctionAddresses.includes(chainConfig.contracts.AuctionManager)) {
        auctionAddresses = [chainConfig.contracts.AuctionManager, ...auctionAddresses];
      }

      // Fetch data for each auction
      const auctionDataPromises = auctionAddresses.map(async (addr, index) => {
        try {
          const auction = new ethers.Contract(addr, AUCTION_ABI, rpcProvider);
          const [
            nftContract,
            tokenId,
            floorPrice,
            currentPhase,
            currentLeader,
            currentHighBid,
            winner,
            finalized,
            paused,
          ] = await Promise.all([
            auction.nftContract().catch(() => ethers.ZeroAddress),
            auction.tokenId().catch(() => BigInt(0)),
            auction.floorPrice().catch(() => BigInt(0)),
            auction.currentPhase().catch(() => 0),
            auction.currentLeader().catch(() => ethers.ZeroAddress),
            auction.currentHighBid().catch(() => BigInt(0)),
            auction.winner().catch(() => ethers.ZeroAddress),
            auction.finalized().catch(() => false),
            auction.paused().catch(() => false),
          ]);

          let timeRemaining = BigInt(0);
          let bidderCount = 0;
          try {
            timeRemaining = await auction.getTimeRemaining();
            bidderCount = Number(await auction.getBidderCount());
          } catch {
            // Some auctions might not have these methods
          }

          return {
            address: addr,
            nftContract,
            tokenId,
            floorPrice,
            currentPhase: Number(currentPhase),
            currentLeader,
            currentHighBid,
            winner,
            finalized,
            paused,
            timeRemaining,
            bidderCount,
            // Use demo data for display
            title: PROPERTY_TITLES[index % PROPERTY_TITLES.length],
            location: PROPERTY_LOCATIONS[index % PROPERTY_LOCATIONS.length],
            image: PROPERTY_IMAGES[index % PROPERTY_IMAGES.length],
          } as AuctionData;
        } catch (error) {
          console.error(`Failed to fetch auction ${addr}:`, error);
          return null;
        }
      });

      const results = await Promise.all(auctionDataPromises);
      const validAuctions = results.filter((a): a is AuctionData => a !== null);
      setAuctions(validAuctions);
    } catch (error) {
      console.error("Failed to fetch auctions:", error);
    } finally {
      setLoading(false);
    }
  }, [rpcProvider, chainConfig]);

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  useEffect(() => {
    const streamTimer = setTimeout(() => {
      setShowStreamCard(true);
    }, 5000);
    return () => clearTimeout(streamTimer);
  }, []);

  // Filter auctions
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

      {/* ====== LIVE BUTTON (floating) ====== */}
      {filtered.length > 0 && (
        <div className="fixed top-20 right-5 z-40">
          <Link
            href={`/pujas?auction=${filtered[0].address}`}
            className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-full border transition-all ${
              liveExploded
                ? "bg-red-500/95 border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.45)] animate-pulse"
                : "bg-white/[0.04] border-white/[0.14] hover:bg-white/[0.08]"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-black tracking-wide text-sm">
              {liveExploded ? "JOIN LIVE" : "LIVE"}
            </span>
          </Link>
        </div>
      )}

      {/* ====== CONTENT ====== */}
      <section className="px-4 py-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Top controls */}
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

          {/* Grid layout: Sidebar + Auctions */}
          <div className="grid grid-cols-[280px_1fr] gap-4 marketLayout">
            {/* Sidebar */}
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

              <div className="mt-3.5 p-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] text-gray-200 text-[13px] leading-tight">
                <b className="text-cyan-400">Tip:</b> Click any property to place a bid on-chain with USDC.
              </div>
            </aside>

            {/* Auctions grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
              {filtered.map((auction, idx) => {
                const isActive = !auction.finalized && !auction.paused;
                const phaseLabels = ["Phase 0", "Phase 1", "Phase 2", "Final"];
                const phaseLabel = phaseLabels[Math.min(auction.currentPhase, 3)];

                return (
                  <Link
                    key={auction.address}
                    href={`/pujas?auction=${auction.address}`}
                    className="block no-underline text-inherit"
                  >
                    <article className="card rounded-2xl border border-white/10 overflow-hidden bg-white/[0.03] relative transition-all hover:-translate-y-0.5 hover:border-cyan-400/30 hover:shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                      <div className="relative">
                        <img
                          src={auction.image || PROPERTY_IMAGES[idx % PROPERTY_IMAGES.length]}
                          alt={auction.title || `Auction ${idx + 1}`}
                          className="w-full h-[170px] object-cover block"
                          style={{ filter: "contrast(1.05) saturate(1.05)" }}
                        />

                        {/* Status Badge */}
                        <div
                          className={`absolute top-3 left-3 px-2.5 py-1.5 rounded-full text-xs font-black border ${
                            isActive
                              ? "bg-green-500/20 border-green-500/30 text-green-300"
                              : "bg-red-500/20 border-red-500/30 text-red-300"
                          }`}
                        >
                          {isActive ? "Active" : "Ended"}
                        </div>

                        {/* Phase Badge */}
                        <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full text-xs font-bold border border-white/20 bg-black/50 text-white/80">
                          {phaseLabel}
                        </div>

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                        {/* Time remaining */}
                        {isActive && (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-xs text-white/80">
                            <span className="text-cyan-400">⏱</span>
                            {formatTimeRemaining(auction.timeRemaining)}
                          </div>
                        )}
                      </div>

                      <div className="p-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-gray-200 leading-tight truncate">
                              {auction.title || `Property #${Number(auction.tokenId)}`}
                            </div>
                            <div className="mt-1.5 text-xs text-gray-400 truncate">
                              {auction.location || shortAddr(auction.address)}
                            </div>
                          </div>

                          <div className="px-2.5 py-2 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] text-cyan-400 font-black text-xs whitespace-nowrap">
                            ${formatUsdc(auction.currentHighBid > BigInt(0) ? auction.currentHighBid : auction.floorPrice)}
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="mt-3 flex gap-2 text-xs text-gray-400">
                          <div className="flex-1 px-2 py-1.5 rounded-lg border border-white/[0.08] bg-black/25 text-center">
                            <span className="text-white/70">{auction.bidderCount}</span> bidders
                          </div>
                          <div className="flex-1 px-2 py-1.5 rounded-lg border border-white/[0.08] bg-black/25 text-center truncate">
                            Leader: <span className="text-cyan-400">{shortAddr(auction.currentLeader)}</span>
                          </div>
                        </div>

                        {/* Phase Progress */}
                        <div className="mt-3">
                          <PhaseProgressBar phase={auction.currentPhase} variant="compact" />
                        </div>

                        {/* Action */}
                        <div className="mt-3 flex gap-2.5">
                          <div className="flex-1 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 font-bold text-center text-sm hover:bg-white/[0.06] transition-colors">
                            {isActive ? "Place Bid" : "View Details"}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}

              {filtered.length === 0 && (
                <div className="col-span-full p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-gray-400 text-center">
                  No auctions found with the current filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showStreamCard && filtered.length > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="w-[280px] h-[280px] rounded-2xl border border-white/[0.12] bg-[#080808]/90 shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-3.5 flex flex-col gap-3 relative pointer-events-auto">
            <button
              type="button"
              className="absolute top-2 right-2 w-7 h-7 rounded-full border border-white/20 bg-white/[0.08] text-white text-lg leading-none cursor-pointer hover:bg-white/[0.15]"
              onClick={() => {
                setShowStreamCard(false);
                setLiveExploded(true);
              }}
            >
              ×
            </button>
            <div className="flex-1 rounded-xl border border-white/[0.12] bg-gradient-to-br from-cyan-400/20 to-red-500/20 flex items-center justify-center text-white font-bold relative overflow-hidden">
              <video
                src="/steam/kling_20260208_Image_to_Video_Animate_th_3148_0_2.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-[1]"
                style={{ filter: "saturate(1.05)" }}
              />
              <div className="z-[2] px-3 py-2 rounded-full bg-black/60 border border-white/20 text-xs">
                Live auction starting
              </div>
            </div>
            <Link
              href={`/pujas?auction=${filtered[0].address}`}
              className="rounded-xl border border-cyan-400/40 bg-cyan-400/15 text-cyan-400 font-bold px-3 py-2.5 cursor-pointer text-center no-underline hover:bg-cyan-400/25 transition-colors"
            >
              Join Auction →
            </Link>
          </div>
        </div>
      )}

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
