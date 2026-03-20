"use client";

import { useState, useCallback } from "react";
import { formatUnits } from "viem";
import { CONTRACTS, auctionAbi } from "@/lib/contracts";
import { useAdmin } from "../AdminContext";
import { shorten, explorerAddress } from "../adminUtils";

const PHASE_LABELS = ["Announcement", "Bidding", "Reveal", "Settlement"] as const;

type AuctionState = {
  address: string;
  tokenId: bigint;
  currentPhase: number;
  currentLeader: string;
  currentHighBid: bigint;
  finalized: boolean;
  biddingOpen: boolean;
  paused: boolean;
  bidderCount: bigint;
  totalParticipationFees: bigint;
  floorPrice: bigint;
  treasury: string;
};

// ─── Auction List ─────────────────────────────────────────────────────────────

function AuctionList({
  list,
  selected,
  onSelect,
}: {
  list: string[];
  selected: string | null;
  onSelect: (addr: string) => void;
}) {
  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/30">No auctions deployed yet.</p>
        <a href="/admin/launch" className="mt-3 inline-block text-xs text-[#2DD4D4] hover:underline">
          Launch your first auction →
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06]">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          {list.length} Auction{list.length !== 1 ? "s" : ""}
        </h2>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {list.map((addr, i) => (
          <button
            key={addr}
            onClick={() => onSelect(addr)}
            className={`w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/[0.04] transition ${
              selected === addr ? "bg-[#2DD4D4]/[0.05] border-l-2 border-[#2DD4D4]/50" : ""
            }`}
          >
            <div>
              <div className="text-xs text-white/40 mb-0.5">#{i + 1}</div>
              <div className="font-mono text-sm text-white">{shorten(addr)}</div>
            </div>
            <a
              href={explorerAddress(addr)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-[#2DD4D4]/50 hover:text-[#2DD4D4] transition"
            >
              ↗
            </a>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Auction Detail ───────────────────────────────────────────────────────────

function AuctionDetail({ address }: { address: string }) {
  const { publicClient, runTx, refreshGlobal, pushToast } = useAdmin();
  const [state, setState] = useState<AuctionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const addr = address as `0x${string}`;
      const calls = [
        { address: addr, abi: auctionAbi, functionName: "tokenId" },
        { address: addr, abi: auctionAbi, functionName: "currentPhase" },
        { address: addr, abi: auctionAbi, functionName: "currentLeader" },
        { address: addr, abi: auctionAbi, functionName: "currentHighBid" },
        { address: addr, abi: auctionAbi, functionName: "finalized" },
        { address: addr, abi: auctionAbi, functionName: "isAuctionActive" },
        { address: addr, abi: auctionAbi, functionName: "paused" },
        { address: addr, abi: auctionAbi, functionName: "getBidderCount" },
        { address: addr, abi: auctionAbi, functionName: "totalParticipationFees" },
        { address: addr, abi: auctionAbi, functionName: "floorPrice" },
        { address: addr, abi: auctionAbi, functionName: "treasury" },
      ] as const;

      const results = await publicClient.multicall({ contracts: calls });
      const [tokenId, phase, leader, highBid, finalized, active, paused, bidderCount, fees, floorPrice, treasury] = results.map((r) => r.result);

      setState({
        address,
        tokenId: tokenId as bigint,
        currentPhase: Number(phase),
        currentLeader: leader as string,
        currentHighBid: highBid as bigint,
        finalized: finalized as boolean,
        biddingOpen: active as boolean,
        paused: paused as boolean,
        bidderCount: bidderCount as bigint,
        totalParticipationFees: fees as bigint,
        floorPrice: floorPrice as bigint,
        treasury: treasury as string,
      });
      setLoaded(true);
    } catch {
      pushToast({ type: "error", title: "Failed to load auction state" });
    } finally {
      setLoading(false);
    }
  }, [address, publicClient, pushToast]);

  const tx = useCallback(
    async (label: string, functionName: string) => {
      await runTx(label, {
        address: address as `0x${string}`,
        abi: auctionAbi,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        functionName: functionName as any,
      });
      await load();
      await refreshGlobal();
    },
    [address, runTx, load, refreshGlobal]
  );

  if (!loaded) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-center space-y-3">
        <p className="text-sm text-white/40">Load state for {shorten(address)}</p>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 px-4 py-2 text-sm font-semibold text-[#2DD4D4] hover:bg-[#2DD4D4]/20 disabled:opacity-40 transition"
        >
          {loading ? "Loading…" : "Load State"}
        </button>
      </div>
    );
  }

  if (!state) return null;

  const fmt = (v: bigint) => `${formatUnits(v, 6)} USDC`;

  return (
    <div className="space-y-4">
      {/* State Overview */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">State</h3>
          <button onClick={load} disabled={loading} className="text-xs text-white/30 hover:text-white/60 transition">
            {loading ? "…" : "↻ Refresh"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Token ID" value={String(state.tokenId)} />
          <StatBox
            label="Phase"
            value={`${state.currentPhase} — ${PHASE_LABELS[state.currentPhase]}`}
          />
          <StatBox label="High Bid" value={fmt(state.currentHighBid)} />
          <StatBox label="Floor Price" value={fmt(state.floorPrice)} />
          <StatBox label="Bidders" value={String(state.bidderCount)} />
          <StatBox label="Part. Fees" value={fmt(state.totalParticipationFees)} />
        </div>

        <div className="flex gap-2 mt-4">
          {[
            { label: state.biddingOpen ? "Bidding Open" : "Bidding Closed", active: state.biddingOpen, color: "emerald" },
            { label: state.finalized ? "Finalized" : "Not Finalized", active: state.finalized, color: "blue" },
            { label: state.paused ? "Paused" : "Running", active: !state.paused, color: "amber" },
          ].map(({ label, active, color }) => (
            <span
              key={label}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                active
                  ? color === "emerald"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : color === "blue"
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-white/[0.04] border-white/10 text-white/30"
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        {state.currentLeader && state.currentLeader !== "0x0000000000000000000000000000000000000000" && (
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <span className="text-xs text-white/40">Leader</span>
            <a href={explorerAddress(state.currentLeader)} target="_blank" rel="noreferrer" className="font-mono text-xs text-[#2DD4D4] hover:underline">
              {shorten(state.currentLeader)} ↗
            </a>
          </div>
        )}
      </div>

      {/* Phase Controls */}
      <Section title="Phase Controls">
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn
            label="Advance Phase"
            onClick={() => tx("Advance Phase", "advancePhase")}
            disabled={state.finalized}
          />
          <ActionBtn
            label="Finalize Auction"
            onClick={() => tx("Finalize Auction", "finalizeAuction")}
            disabled={state.finalized || state.currentPhase < 3}
            variant="purple"
          />
        </div>
      </Section>

      {/* Financial */}
      <Section title="Financial">
        <ActionBtn
          label="Withdraw Proceeds"
          onClick={() => tx("Withdraw Proceeds", "withdrawProceeds")}
          disabled={!state.finalized}
          variant="emerald"
          full
        />
        <p className="text-xs text-white/30 mt-1.5">
          Treasury: <a href={explorerAddress(state.treasury)} target="_blank" rel="noreferrer" className="text-[#2DD4D4] hover:underline">{shorten(state.treasury)} ↗</a>
        </p>
      </Section>

      {/* Controls */}
      <Section title="Controls">
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn
            label={state.paused ? "Unpause" : "Pause"}
            onClick={() => tx(state.paused ? "Unpause Auction" : "Pause Auction", state.paused ? "unpause" : "pause")}
            variant="amber"
          />
        </div>
      </Section>

      {/* Emergency */}
      <Section title="Emergency Actions">
        <div className="grid grid-cols-2 gap-2">
          <DangerBtn
            label="Emergency Withdraw Funds"
            onClick={() => tx("Emergency Withdraw Funds", "emergencyWithdrawFunds")}
          />
          <DangerBtn
            label="Emergency Withdraw NFT"
            onClick={() => tx("Emergency Withdraw NFT", "emergencyWithdrawNFT")}
          />
        </div>
        <p className="text-xs text-red-400/60 mt-2">
          Use only in emergencies. These bypass normal auction flow.
        </p>
      </Section>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
      <div className="text-[10px] text-white/30 mb-1">{label}</div>
      <div className="text-sm font-semibold text-white truncate">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3">{title}</div>
      {children}
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
  variant = "default",
  full,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "purple" | "emerald" | "amber";
  full?: boolean;
}) {
  const colors = {
    default: "bg-[#2DD4D4]/10 border-[#2DD4D4]/20 text-[#2DD4D4] hover:bg-[#2DD4D4]/20",
    purple: "bg-[#a78bfa]/10 border-[#a78bfa]/20 text-[#a78bfa] hover:bg-[#a78bfa]/20",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full" : ""} rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40 transition ${colors[variant]}`}
    >
      {label}
    </button>
  );
}

function DangerBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
    >
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuctionsPage() {
  const { auctionsList } = useAdmin();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Auctions</h1>
          <p className="text-sm text-white/40 mt-1">Control phase progression, finalization, and emergency functions.</p>
        </div>
        <a
          href="/admin/launch"
          className="rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/20 px-3 py-1.5 text-xs font-semibold text-[#a78bfa] hover:bg-[#a78bfa]/20 transition flex-shrink-0"
        >
          + New Auction
        </a>
      </div>

      <div className={`grid gap-6 ${selected ? "lg:grid-cols-2" : ""}`}>
        <AuctionList list={auctionsList} selected={selected} onSelect={setSelected} />
        {selected && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-xs text-white/40">{shorten(selected)}</div>
              <button onClick={() => setSelected(null)} className="text-xs text-white/30 hover:text-white/60 transition">✕ Deselect</button>
            </div>
            <AuctionDetail key={selected} address={selected} />
          </div>
        )}
      </div>
    </div>
  );
}
