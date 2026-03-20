"use client";

import { useState, useEffect, useCallback } from "react";
import { isAddress, type Address } from "viem";
import { useAdmin } from "../AdminContext";
import { shorten } from "../adminUtils";

type AdminWallet = {
  id: string;
  wallet_address: string;
  label: string | null;
  created_at: string;
  created_by: string | null;
};

const IN = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-[#2DD4D4]/40 focus:outline-none";

export default function SettingsPage() {
  const { walletAddress, pushToast } = useAdmin();
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAddr, setNewAddr] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/wallets");
      if (res.ok) setWallets(await res.json());
    } catch {
      pushToast({ type: "error", title: "Failed to load admin wallets" });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!isAddress(newAddr) || !walletAddress) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: newAddr,
          label: newLabel.trim() || null,
          created_by: walletAddress,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        pushToast({ type: "error", title: "Failed to add", detail: err.error });
      } else {
        pushToast({ type: "success", title: "Admin wallet added" });
        setNewAddr("");
        setNewLabel("");
        load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (addr: string) => {
    if (!walletAddress) return;
    try {
      const res = await fetch("/api/admin/wallets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: addr, requested_by: walletAddress }),
      });
      if (!res.ok) {
        const err = await res.json();
        pushToast({ type: "error", title: "Failed to remove", detail: err.error });
      } else {
        pushToast({ type: "success", title: "Wallet removed" });
        load();
      }
    } catch {
      pushToast({ type: "error", title: "Network error" });
    }
  };

  const addrValid = isAddress(newAddr);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-white/40 mt-1">Manage admin wallet access.</p>
      </div>

      {/* Add new admin */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Add Admin Wallet</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Wallet Address</label>
            <input
              value={newAddr}
              onChange={(e) => setNewAddr(e.target.value)}
              placeholder="0x…"
              className={`${IN} ${newAddr && !addrValid ? "border-red-400/40" : ""}`}
            />
            {newAddr && !addrValid && <p className="text-xs text-red-400 mt-1">Invalid address</p>}
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Label (optional)</label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Operations, William"
              className={IN}
            />
          </div>
          <button
            onClick={add}
            disabled={!addrValid || submitting}
            className="w-full rounded-lg bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 px-4 py-2.5 text-sm font-semibold text-[#2DD4D4] hover:bg-[#2DD4D4]/20 disabled:opacity-40 transition"
          >
            {submitting ? "Adding…" : "Add Admin"}
          </button>
        </div>
      </div>

      {/* Admin wallet list */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
            Admin Wallets {!loading && `(${wallets.length})`}
          </h2>
          <button onClick={load} disabled={loading} className="text-xs text-white/30 hover:text-white/60 transition">
            {loading ? "…" : "↻"}
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-white/30">Loading…</div>
        ) : wallets.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/30">
            No wallets in database. Add one above or rely on{" "}
            <code className="font-mono text-white/40">NEXT_PUBLIC_ADMIN_ADDRESSES</code> env var.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {wallets.map((w) => {
              const isSelf = walletAddress?.toLowerCase() === w.wallet_address.toLowerCase();
              return (
                <div key={w.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white">{shorten(w.wallet_address)}</span>
                      {isSelf && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 text-[#2DD4D4]">
                          You
                        </span>
                      )}
                      {w.label && (
                        <span className="text-[11px] text-white/40">{w.label}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-white/25 mt-0.5 font-mono">{w.wallet_address}</div>
                    {w.created_by && (
                      <div className="text-[10px] text-white/20 mt-0.5">
                        Added by {shorten(w.created_by)} · {new Date(w.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(w.wallet_address)}
                    disabled={isSelf}
                    title={isSelf ? "Cannot remove yourself" : "Remove"}
                    className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Env var note */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4">
        <p className="text-xs text-white/30 leading-relaxed">
          <span className="text-white/50 font-semibold">Bootstrap note:</span> Wallets in{" "}
          <code className="font-mono text-white/40">NEXT_PUBLIC_ADMIN_ADDRESSES</code> always have access
          regardless of this table. Use the env var for your primary admin wallet as a fallback.
        </p>
      </div>
    </div>
  );
}
