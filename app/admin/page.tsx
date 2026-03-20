"use client";

import Link from "next/link";
import { CONTRACTS, CHAIN_META } from "@/lib/contracts";
import { useAdmin } from "./AdminContext";
import { shorten, explorerAddress } from "./adminUtils";

export default function AdminOverview() {
  const {
    nftAdmin,
    nftNextTokenId,
    factoryOwner,
    auctionsList,
    walletAddress,
    isNftAdmin,
    isFactoryOwner,
    lastRefreshed,
    refreshGlobal,
  } = useAdmin();

  const propertiesMinted = nftNextTokenId !== null ? Number(nftNextTokenId) - 1 : null;

  const contracts = [
    { label: "HouseNFT", address: CONTRACTS.HouseNFT, role: isNftAdmin ? "You are Admin" : nftAdmin ? `Admin: ${shorten(nftAdmin)}` : null },
    { label: "AuctionFactory", address: CONTRACTS.AuctionFactory, role: isFactoryOwner ? "You are Owner" : factoryOwner ? `Owner: ${shorten(factoryOwner)}` : null },
    { label: "USDC", address: CONTRACTS.USDC, role: null },
  ];

  const quickActions = [
    {
      href: "/admin/properties",
      title: "Properties",
      description: "Mint NFTs and configure phase metadata before launching.",
      badge: propertiesMinted !== null ? `${propertiesMinted} minted` : null,
      accent: "#2DD4D4",
    },
    {
      href: "/admin/launch",
      title: "Launch Auction",
      description: "Step-by-step wizard: verify token → set URIs → configure → deploy.",
      badge: "Wizard",
      accent: "#a78bfa",
    },
    {
      href: "/admin/auctions",
      title: "Manage Auctions",
      description: "Advance phases, finalize, withdraw proceeds, and emergency controls.",
      badge: auctionsList.length > 0 ? `${auctionsList.length} created` : null,
      accent: "#34d399",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-white/40 mt-1">ZBricks Admin Dashboard · {CHAIN_META.chainName}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/30">
          {lastRefreshed && <span>Updated {lastRefreshed.toLocaleTimeString()}</span>}
          <button
            onClick={refreshGlobal}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 hover:bg-white/10 hover:text-white transition text-xs"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Properties Minted"
          value={propertiesMinted !== null ? String(propertiesMinted) : "—"}
        />
        <StatCard
          label="Auctions Created"
          value={String(auctionsList.length)}
        />
        <StatCard
          label="Your Role"
          value={isNftAdmin && isFactoryOwner ? "Admin + Owner" : isNftAdmin ? "NFT Admin" : isFactoryOwner ? "Factory Owner" : walletAddress ? "No role" : "Not connected"}
          highlight={isNftAdmin || isFactoryOwner}
        />
      </div>

      {/* Contracts */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
          Deployed Contracts
        </h2>
        <div className="space-y-4">
          {contracts.map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{c.label}</div>
                {c.role && (
                  <div className="text-xs text-white/40 mt-0.5">{c.role}</div>
                )}
              </div>
              <a
                href={explorerAddress(c.address)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-sm text-[#2DD4D4] hover:underline flex items-center gap-1"
              >
                {shorten(c.address)}
                <span className="text-[10px] opacity-60">↗</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
          Sections
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="block rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-white/20 hover:bg-white/[0.04] transition group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white group-hover:text-[#2DD4D4] transition text-base">
                  {a.title}
                </h3>
                {a.badge && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-white/50 ml-2 flex-shrink-0">
                    {a.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/40 leading-relaxed">{a.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="text-xs text-white/40 mb-1.5">{label}</div>
      <div
        className={`text-2xl font-bold ${highlight ? "text-[#2DD4D4]" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}
