"use client";

import { useState, useCallback } from "react";
import { isAddress, parseUnits, type Address } from "viem";
import { CONTRACTS, houseNftAbi, factoryAbi } from "@/lib/contracts";
import { useAdmin } from "../AdminContext";
import { shorten, explorerAddress, daysToSeconds } from "../adminUtils";

const PHASE_LABELS = ["Announcement", "Bidding", "Reveal", "Settlement"] as const;

const IN = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-[#2DD4D4]/40 focus:outline-none";
const SEL = "w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-[#2DD4D4]/40 focus:outline-none";

// ─── Step types ───────────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3 | 4;

type AuctionParams = {
  adminAddress: string;
  treasury: string;
  tokenId: string;
  factoryOwner: string;
  phaseDurations: [string, string, string, string]; // days
  floorPrice: string; // USDC
  minBidIncrementPercent: string;
  enforceMinIncrement: boolean;
  participationFee: string; // USDC
};

const DEFAULT_PARAMS: AuctionParams = {
  adminAddress: "",
  treasury: "",
  tokenId: "",
  factoryOwner: "",
  phaseDurations: ["7", "14", "7", "3"],
  floorPrice: "50000",
  minBidIncrementPercent: "5",
  enforceMinIncrement: true,
  participationFee: "100",
};

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepBadge({ step, current }: { step: StepId; current: StepId }) {
  const done = current > step;
  const active = current === step;
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
        done
          ? "bg-[#2DD4D4]/20 border-[#2DD4D4]/40 text-[#2DD4D4]"
          : active
          ? "bg-[#2DD4D4]/10 border-[#2DD4D4]/30 text-[#2DD4D4]"
          : "bg-white/[0.03] border-white/10 text-white/25"
      }`}
    >
      {done ? "✓" : step}
    </div>
  );
}

function StepHeader({ step, current, title, subtitle }: { step: StepId; current: StepId; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <StepBadge step={step} current={current} />
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Step 1: Verify Token ─────────────────────────────────────────────────────

function Step1({ params, setParams, onNext }: { params: AuctionParams; setParams: React.Dispatch<React.SetStateAction<AuctionParams>>; onNext: () => void }) {
  const { publicClient, pushToast } = useAdmin();
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState<{ owner: string; phase: number } | null>(null);

  const verify = useCallback(async () => {
    const id = params.tokenId.trim();
    if (!id || isNaN(Number(id))) return;
    setChecking(true);
    setVerified(null);
    try {
      const tid = BigInt(id);
      const [owner, phase] = await Promise.all([
        publicClient.readContract({ address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "ownerOf", args: [tid] }),
        publicClient.readContract({ address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "tokenPhase", args: [tid] }),
      ]);
      const ownerAddr = owner as string;
      setVerified({ owner: ownerAddr, phase: Number(phase) });

      const ownedByFactory = ownerAddr.toLowerCase() === CONTRACTS.AuctionFactory.toLowerCase();
      if (!ownedByFactory) {
        pushToast({ type: "error", title: "Token not owned by factory", detail: `Owner: ${shorten(ownerAddr)}. Use Properties → Mint to Factory first.` });
      }
    } catch {
      pushToast({ type: "error", title: "Token not found. Check token ID." });
    } finally {
      setChecking(false);
    }
  }, [params.tokenId, publicClient, pushToast]);

  const ownedByFactory = verified?.owner.toLowerCase() === CONTRACTS.AuctionFactory.toLowerCase();
  const canProceed = !!verified && ownedByFactory;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <StepHeader step={1} current={1} title="Verify Token" subtitle="Confirm the NFT token exists and is held by the AuctionFactory." />

      <div className="space-y-3">
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Token ID</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={params.tokenId}
              onChange={(e) => { setParams((p) => ({ ...p, tokenId: e.target.value })); setVerified(null); }}
              placeholder="e.g. 1"
              className={`${IN} flex-1`}
            />
            <button
              onClick={verify}
              disabled={checking || !params.tokenId}
              className="rounded-lg bg-white/[0.06] border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/[0.10] disabled:opacity-40 transition"
            >
              {checking ? "…" : "Verify"}
            </button>
          </div>
        </div>

        {verified && (
          <div className={`rounded-lg border p-3 space-y-1.5 ${ownedByFactory ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-red-500/20 bg-red-500/[0.05]"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Owner</span>
              <a href={explorerAddress(verified.owner)} target="_blank" rel="noreferrer" className="font-mono text-xs text-[#2DD4D4] hover:underline">
                {shorten(verified.owner)} ↗
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Factory holds token</span>
              <span className={`text-xs font-semibold ${ownedByFactory ? "text-emerald-400" : "text-red-400"}`}>
                {ownedByFactory ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">NFT Phase</span>
              <span className="text-xs text-white">{verified.phase} — {PHASE_LABELS[verified.phase]}</span>
            </div>
          </div>
        )}

        {!canProceed && verified && !ownedByFactory && (
          <p className="text-xs text-amber-400">
            Go to Properties → Mint to Factory to transfer ownership first.
          </p>
        )}

        <button onClick={onNext} disabled={!canProceed} className="w-full rounded-lg bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 px-4 py-2.5 text-sm font-semibold text-[#2DD4D4] hover:bg-[#2DD4D4]/20 disabled:opacity-40 transition">
          Continue to Auction Config →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Auction Config ───────────────────────────────────────────────────

function Step2({ params, setParams, onBack, onNext }: { params: AuctionParams; setParams: React.Dispatch<React.SetStateAction<AuctionParams>>; onBack: () => void; onNext: () => void }) {
  const setDuration = (i: number, v: string) =>
    setParams((p) => {
      const d = [...p.phaseDurations] as [string, string, string, string];
      d[i] = v;
      return { ...p, phaseDurations: d };
    });

  const ready =
    params.phaseDurations.every((d) => d && parseFloat(d) > 0) &&
    !!params.floorPrice &&
    !!params.minBidIncrementPercent;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <StepHeader step={2} current={2} title="Configure Auction" subtitle="Set phase durations, pricing, and bidding rules." />

      <div className="space-y-5">
        {/* Phase Durations */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">Phase Durations (days)</label>
          <div className="grid grid-cols-2 gap-2">
            {PHASE_LABELS.map((label, i) => (
              <div key={i}>
                <div className="text-[10px] text-white/30 mb-1">{label}</div>
                <input
                  type="number"
                  min="0.01"
                  step="0.5"
                  value={params.phaseDurations[i]}
                  onChange={(e) => setDuration(i, e.target.value)}
                  className={IN}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Floor Price (USDC)</label>
            <input type="number" min="0" value={params.floorPrice} onChange={(e) => setParams((p) => ({ ...p, floorPrice: e.target.value }))} placeholder="50000" className={IN} />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Participation Fee (USDC)</label>
            <input type="number" min="0" value={params.participationFee} onChange={(e) => setParams((p) => ({ ...p, participationFee: e.target.value }))} placeholder="100" className={IN} />
          </div>
        </div>

        {/* Bid Increment */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Min Bid Increment (%)</label>
            <input type="number" min="0" value={params.minBidIncrementPercent} onChange={(e) => setParams((p) => ({ ...p, minBidIncrementPercent: e.target.value }))} placeholder="5" className={IN} />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Enforce Min Increment</label>
            <select value={params.enforceMinIncrement ? "true" : "false"} onChange={(e) => setParams((p) => ({ ...p, enforceMinIncrement: e.target.value === "true" }))} className={SEL}>
              <option value="true">Yes (required)</option>
              <option value="false">No (recommended)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onBack} className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] transition">← Back</button>
          <button onClick={onNext} disabled={!ready} className="flex-1 rounded-lg bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 px-4 py-2.5 text-sm font-semibold text-[#2DD4D4] hover:bg-[#2DD4D4]/20 disabled:opacity-40 transition">
            Set Addresses →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Addresses ────────────────────────────────────────────────────────

function Step3({ params, setParams, onBack, onNext }: { params: AuctionParams; setParams: React.Dispatch<React.SetStateAction<AuctionParams>>; onBack: () => void; onNext: () => void }) {
  const adminValid = isAddress(params.adminAddress);
  const treasuryValid = isAddress(params.treasury);
  const ready = adminValid && treasuryValid;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <StepHeader step={3} current={3} title="Addresses" subtitle="Set the auction admin and treasury addresses." />

      <div className="space-y-4">
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Auction Admin</label>
          <input
            value={params.adminAddress}
            onChange={(e) => setParams((p) => ({ ...p, adminAddress: e.target.value }))}
            placeholder="0x… wallet that will manage this auction"
            className={`${IN} ${params.adminAddress && !adminValid ? "border-red-400/40" : ""}`}
          />
          {params.adminAddress && !adminValid && <p className="text-xs text-red-400 mt-1">Invalid address</p>}
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Treasury</label>
          <input
            value={params.treasury}
            onChange={(e) => setParams((p) => ({ ...p, treasury: e.target.value }))}
            placeholder="0x… wallet to receive proceeds"
            className={`${IN} ${params.treasury && !treasuryValid ? "border-red-400/40" : ""}`}
          />
          {params.treasury && !treasuryValid && <p className="text-xs text-red-400 mt-1">Invalid address</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onBack} className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] transition">← Back</button>
          <button onClick={onNext} disabled={!ready} className="flex-1 rounded-lg bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 px-4 py-2.5 text-sm font-semibold text-[#2DD4D4] hover:bg-[#2DD4D4]/20 disabled:opacity-40 transition">
            Review & Launch →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Review & Launch ──────────────────────────────────────────────────

function Step4({ params, onBack, onSuccess }: { params: AuctionParams; onBack: () => void; onSuccess: (addr: string) => void }) {
  const { runTx, refreshGlobal } = useAdmin();

  const launch = async () => {
    const phaseDurationsSeconds = params.phaseDurations.map(daysToSeconds) as [bigint, bigint, bigint, bigint];
    const floorPriceMicro = parseUnits(params.floorPrice, 6);
    const participationFeeMicro = parseUnits(params.participationFee, 6);
    const minIncrement = BigInt(Math.round(parseFloat(params.minBidIncrementPercent)));

    const hash = await runTx("Create Auction", {
      address: CONTRACTS.AuctionFactory,
      abi: factoryAbi,
      functionName: "createAuction",
      args: [
        params.adminAddress as Address,
        BigInt(params.tokenId),
        phaseDurationsSeconds,
        floorPriceMicro,
        minIncrement,
        params.enforceMinIncrement,
        participationFeeMicro,
        params.treasury as Address,
      ],
    });

    if (hash) {
      await refreshGlobal();
      onSuccess(hash);
    }
  };

  const rows: [string, string][] = [
    ["Token ID", params.tokenId],
    ["Auction Admin", shorten(params.adminAddress)],
    ["Treasury", shorten(params.treasury)],
    ["Phase 0 — Announcement", `${params.phaseDurations[0]}d`],
    ["Phase 1 — Bidding", `${params.phaseDurations[1]}d`],
    ["Phase 2 — Reveal", `${params.phaseDurations[2]}d`],
    ["Phase 3 — Settlement", `${params.phaseDurations[3]}d`],
    ["Floor Price", `${params.floorPrice} USDC`],
    ["Min Bid Increment", `${params.minBidIncrementPercent}%`],
    ["Enforce Min Increment", params.enforceMinIncrement ? "Yes" : "No"],
    ["Participation Fee", `${params.participationFee} USDC`],
  ];

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <StepHeader step={4} current={4} title="Review & Launch" subtitle="Confirm all parameters before deploying the auction contract." />

      <div className="space-y-2 mb-5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
            <span className="text-xs text-white/40">{label}</span>
            <span className="text-sm font-mono text-white">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] transition">← Back</button>
        <button
          onClick={launch}
          className="flex-1 rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/20 px-4 py-2.5 text-sm font-semibold text-[#a78bfa] hover:bg-[#a78bfa]/20 transition"
        >
          🚀 Deploy Auction
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LaunchPage() {
  const [step, setStep] = useState<StepId>(1);
  const [params, setParams] = useState<AuctionParams>(DEFAULT_PARAMS);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  if (successTx) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Launch Auction</h1>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-8 text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <h2 className="text-xl font-bold text-emerald-400">Auction Deployed</h2>
          <p className="text-sm text-white/50">Token #{params.tokenId} auction has been created.</p>
          <p className="font-mono text-xs text-white/30 break-all">TX: {successTx}</p>
          <div className="flex justify-center gap-3 pt-2">
            <a href="/admin/auctions" className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition">
              Manage Auctions
            </a>
            <button
              onClick={() => { setParams(DEFAULT_PARAMS); setStep(1); setSuccessTx(null); }}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.08] transition"
            >
              Launch Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Launch Auction</h1>
        <p className="text-sm text-white/40 mt-1">Step-by-step wizard to deploy a new CCA auction contract.</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2">
        {([1, 2, 3, 4] as StepId[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <StepBadge step={s} current={step} />
            {i < 3 && <div className={`h-px flex-1 w-8 ${step > s ? "bg-[#2DD4D4]/30" : "bg-white/[0.06]"}`} />}
          </div>
        ))}
        <div className="ml-2 text-xs text-white/30">Step {step} of 4</div>
      </div>

      <div className="max-w-xl">
        {step === 1 && <Step1 params={params} setParams={setParams} onNext={() => setStep(2)} />}
        {step === 2 && <Step2 params={params} setParams={setParams} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <Step3 params={params} setParams={setParams} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <Step4 params={params} onBack={() => setStep(3)} onSuccess={(tx) => setSuccessTx(tx)} />}
      </div>
    </div>
  );
}
