"use client";

import { useState, useCallback } from "react";
import { isAddress, type Address } from "viem";
import { CONTRACTS, houseNftAbi } from "@/lib/contracts";
import { useAdmin } from "../AdminContext";
import { shorten, explorerAddress } from "../adminUtils";

const PHASE_LABELS = ["Announcement", "Bidding", "Reveal", "Settlement"] as const;

const IN = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-[#2DD4D4]/40 focus:outline-none";
const BTN = "w-full rounded-lg bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 px-4 py-2.5 text-sm font-semibold text-[#2DD4D4] hover:bg-[#2DD4D4]/20 disabled:opacity-40 transition";
const SEL = "w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-[#2DD4D4]/40 focus:outline-none";

// ─── Token Lookup ────────────────────────────────────────────────────────────

type TokenInfo = { owner: string; phase: number; uris: string[] };

function TokenLookup() {
  const { publicClient, pushToast } = useAdmin();
  const [tokenId, setTokenId] = useState("");
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async () => {
    const id = tokenId.trim();
    if (!id || isNaN(Number(id))) return;
    setLoading(true);
    try {
      const tid = BigInt(id);
      const [owner, phase, ...uriResults] = await Promise.all([
        publicClient.readContract({ address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "ownerOf", args: [tid] }),
        publicClient.readContract({ address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "tokenPhase", args: [tid] }),
        ...([0, 1, 2, 3] as const).map((p) =>
          publicClient.readContract({ address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "getPhaseURI", args: [tid, p] })
        ),
      ]);
      setInfo({ owner: owner as string, phase: Number(phase), uris: uriResults as string[] });
    } catch {
      pushToast({ type: "error", title: "Token not found or not minted" });
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, [tokenId, publicClient, pushToast]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Token Lookup</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="number"
          min="1"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Token ID (e.g. 1)"
          className={`${IN} flex-1`}
        />
        <button
          onClick={lookup}
          disabled={loading || !tokenId}
          className="rounded-lg bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 px-4 py-2 text-sm font-semibold text-[#2DD4D4] hover:bg-[#2DD4D4]/20 disabled:opacity-40 transition"
        >
          {loading ? "…" : "Lookup"}
        </button>
      </div>

      {info && (
        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Owner</span>
            <a href={explorerAddress(info.owner)} target="_blank" rel="noreferrer" className="font-mono text-xs text-[#2DD4D4] hover:underline">
              {shorten(info.owner)} ↗
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Current Phase</span>
            <span className="text-sm font-semibold text-white">{info.phase} — {PHASE_LABELS[info.phase]}</span>
          </div>
          <div>
            <div className="text-xs text-white/40 mb-2">Phase URIs</div>
            <div className="space-y-1.5">
              {info.uris.map((uri, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 w-28 flex-shrink-0">{PHASE_LABELS[i]}</span>
                  <span className="font-mono text-[11px] text-white/50 truncate">{uri || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mint To Factory ─────────────────────────────────────────────────────────

function MintToFactory() {
  const { runTx, refreshGlobal } = useAdmin();

  const mint = async () => {
    const hash = await runTx("Mint NFT to Factory", {
      address: CONTRACTS.HouseNFT,
      abi: houseNftAbi,
      functionName: "mintTo",
      args: [CONTRACTS.AuctionFactory],
    });
    if (hash) refreshGlobal();
  };

  return (
    <Card title="Mint to Factory" description="Mints a new HouseNFT directly to the AuctionFactory. The factory holds the token until an auction is created.">
      <button onClick={mint} className={BTN}>Mint to Factory</button>
    </Card>
  );
}

// ─── Set Phase URIs ──────────────────────────────────────────────────────────

function SetPhaseURIs() {
  const { runTx } = useAdmin();
  const [tokenId, setTokenId] = useState("");
  const [uris, setUris] = useState(["", "", "", ""]);

  const setUri = (i: number, v: string) =>
    setUris((prev) => prev.map((u, idx) => (idx === i ? v : u)));

  const submit = async () => {
    if (!tokenId || uris.some((u) => !u.trim())) return;
    await runTx("Set Phase URIs", {
      address: CONTRACTS.HouseNFT,
      abi: houseNftAbi,
      functionName: "setPhaseURIs",
      args: [BigInt(tokenId), uris as [string, string, string, string]],
    });
  };

  return (
    <Card title="Set Phase URIs" description="Set all 4 phase metadata URIs for a token at once.">
      <div className="space-y-2">
        <input type="number" min="1" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="Token ID" className={IN} />
        {PHASE_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-white/30 w-28 flex-shrink-0">{label}</span>
            <input
              value={uris[i]}
              onChange={(e) => setUri(i, e.target.value)}
              placeholder={`ipfs://…/phase${i}.json`}
              className={`${IN} flex-1`}
            />
          </div>
        ))}
        <button onClick={submit} disabled={!tokenId || uris.some((u) => !u.trim())} className={BTN}>
          Set All URIs
        </button>
      </div>
    </Card>
  );
}

// ─── Update Single URI ────────────────────────────────────────────────────────

function UpdatePhaseURI() {
  const { runTx } = useAdmin();
  const [tokenId, setTokenId] = useState("");
  const [phase, setPhase] = useState("0");
  const [uri, setUri] = useState("");

  const submit = async () => {
    if (!tokenId || !uri.trim()) return;
    await runTx("Update Phase URI", {
      address: CONTRACTS.HouseNFT,
      abi: houseNftAbi,
      functionName: "updatePhaseURI",
      args: [BigInt(tokenId), Number(phase) as 0 | 1 | 2 | 3, uri],
    });
  };

  return (
    <Card title="Update Single URI" description="Update metadata URI for one specific phase of a token.">
      <div className="space-y-2">
        <input type="number" min="1" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="Token ID" className={IN} />
        <select value={phase} onChange={(e) => setPhase(e.target.value)} className={SEL}>
          {PHASE_LABELS.map((label, i) => (
            <option key={i} value={i}>{i} — {label}</option>
          ))}
        </select>
        <input value={uri} onChange={(e) => setUri(e.target.value)} placeholder="ipfs://…/metadata.json" className={IN} />
        <button onClick={submit} disabled={!tokenId || !uri.trim()} className={BTN}>Update URI</button>
      </div>
    </Card>
  );
}

// ─── Advance NFT Phase ────────────────────────────────────────────────────────

function AdvanceNftPhase() {
  const { runTx } = useAdmin();
  const [tokenId, setTokenId] = useState("");
  const [newPhase, setNewPhase] = useState("1");

  const submit = async () => {
    if (!tokenId) return;
    await runTx("Advance NFT Phase", {
      address: CONTRACTS.HouseNFT,
      abi: houseNftAbi,
      functionName: "advancePhase",
      args: [BigInt(tokenId), Number(newPhase)],
    });
  };

  return (
    <Card title="Advance NFT Phase" description="Manually advance the metadata phase of a specific token.">
      <div className="space-y-2">
        <input type="number" min="1" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="Token ID" className={IN} />
        <select value={newPhase} onChange={(e) => setNewPhase(e.target.value)} className={SEL}>
          {PHASE_LABELS.map((label, i) => (
            <option key={i} value={i}>{i} — {label}</option>
          ))}
        </select>
        <button onClick={submit} disabled={!tokenId} className={BTN}>Advance Phase</button>
      </div>
    </Card>
  );
}

// ─── Transfer Admin ───────────────────────────────────────────────────────────

function TransferAdmin() {
  const { runTx } = useAdmin();
  const [newAdmin, setNewAdmin] = useState("");
  const valid = isAddress(newAdmin);

  const submit = async () => {
    if (!valid) return;
    await runTx("Transfer NFT Admin", {
      address: CONTRACTS.HouseNFT,
      abi: houseNftAbi,
      functionName: "transferAdmin",
      args: [newAdmin as Address],
    });
  };

  return (
    <Card title="Transfer NFT Admin" description="Transfer admin role of the HouseNFT contract to a new address. This cannot be undone.">
      <div className="space-y-2">
        <input
          value={newAdmin}
          onChange={(e) => setNewAdmin(e.target.value)}
          placeholder="0x… new admin address"
          className={`${IN} ${newAdmin && !valid ? "border-red-400/40" : ""}`}
        />
        {newAdmin && !valid && <p className="text-xs text-red-400">Invalid address</p>}
        <button
          onClick={submit}
          disabled={!valid}
          className="w-full rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition"
        >
          Transfer Admin
        </button>
      </div>
    </Card>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
        <p className="text-xs text-white/40 leading-relaxed">{description}</p>
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Properties</h1>
        <p className="text-sm text-white/40 mt-1">Mint HouseNFT tokens and configure phase metadata.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <TokenLookup />
          <MintToFactory />
        </div>
        <div className="space-y-6">
          <SetPhaseURIs />
          <UpdatePhaseURI />
          <AdvanceNftPhase />
          <TransferAdmin />
        </div>
      </div>
    </div>
  );
}
