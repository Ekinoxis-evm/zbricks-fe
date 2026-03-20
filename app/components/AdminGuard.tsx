"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { isAdminWallet } from "@/lib/admin";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

async function checkAdminInDb(wallet: string): Promise<boolean> {
  const { data } = await supabase
    .from("admin_wallets")
    .select("id")
    .eq("wallet_address", wallet.toLowerCase())
    .single();
  return !!data;
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const walletAddress = user?.wallet?.address;

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !walletAddress) {
      setHasAccess(false);
      return;
    }

    // Env var check is instant — if it passes, grant access immediately
    if (isAdminWallet(walletAddress)) {
      setHasAccess(true);
      return;
    }

    // Otherwise check Supabase admin_wallets table
    checkAdminInDb(walletAddress)
      .then(setHasAccess)
      .catch(() => setHasAccess(false));
  }, [ready, authenticated, walletAddress]);

  // Loading states
  if (!ready || hasAccess === null) return null;

  if (!hasAccess) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#030712",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 24,
            }}
          >
            🔒
          </div>
          <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
            Access Restricted
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            {!authenticated
              ? "You must be signed in with an authorized wallet to access the admin panel."
              : "Your wallet is not authorized to access the admin panel."}
          </p>
          <Link
            href="/auctions"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: 999,
              background: "#2DD4D4",
              color: "#0f172a",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
