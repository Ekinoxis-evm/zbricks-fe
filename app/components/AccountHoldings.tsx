"use client";

import React, { useState, useEffect } from "react";
import { useReadContract, useAccount } from "wagmi";
import { formatUnits } from "viem";
import { erc20Abi, CONTRACTS, ACTIVE_NETWORK } from "@/lib/contracts";
import Image from "next/image";
import Card, { CardContent } from "./Card";
import Button from "./Button";

const USDC_DECIMALS = 6;

export default function AccountHoldings() {
  const { address } = useAccount();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usdToCop, setUsdToCop] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates?.COP) setUsdToCop(data.rates.COP);
      })
      .catch(() => {});
  }, []);

  const { data: usdcRaw, isLoading: usdcLoading, refetch: refetchUsdc } = useReadContract({
    address: CONTRACTS.USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
    chainId: ACTIVE_NETWORK,
  });

  const { data: ecopRaw, isLoading: ecopLoading, refetch: refetchEcop } = useReadContract({
    address: CONTRACTS.ECOP,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
    chainId: ACTIVE_NETWORK,
  });

  const { data: ecopDecimals } = useReadContract({
    address: CONTRACTS.ECOP,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: true },
    chainId: ACTIVE_NETWORK,
  });

  const usdcBalance = usdcRaw ? parseFloat(formatUnits(usdcRaw, USDC_DECIMALS)) : 0;
  const ecopBalance = ecopRaw !== undefined && ecopDecimals !== undefined
    ? parseFloat(formatUnits(ecopRaw, ecopDecimals))
    : 0;

  const usdcInCop = usdToCop ? usdcBalance * usdToCop : null;
  const totalCop = usdcInCop !== null ? usdcInCop + ecopBalance : null;

  const isLoading = usdcLoading || ecopLoading;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchUsdc(), refetchEcop()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const fmtCop = (n: number) =>
    n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const fmtUsd = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card variant="highlight">
      <CardContent>
        {/* Total in COP */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Balance</div>
            <div className="text-4xl font-bold text-[#2DD4D4]">
              {isLoading || totalCop === null ? (
                <span className="text-2xl text-white/30">Loading…</span>
              ) : (
                `$${fmtCop(totalCop)} COP`
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        {/* Token breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {/* USDC */}
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <Image src="/tokens/usdc.png" alt="USDC" width={20} height={20} />
              </div>
              <span className="text-xs text-white/50 font-medium">USDC</span>
            </div>
            <div className="text-base font-semibold text-white">
              {usdcLoading ? (
                <span className="text-sm text-white/30">—</span>
              ) : (
                `$${fmtUsd(usdcBalance)}`
              )}
            </div>
            {usdcInCop !== null && (
              <div className="text-xs text-white/30 mt-0.5">${fmtCop(usdcInCop)} COP</div>
            )}
          </div>

          {/* ECOP */}
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <Image src="/tokens/ecop.png" alt="ECOP" width={20} height={20} />
              </div>
              <span className="text-xs text-white/50 font-medium">ECOP</span>
            </div>
            <div className="text-base font-semibold text-white">
              {ecopLoading ? (
                <span className="text-sm text-white/30">—</span>
              ) : (
                `$${fmtCop(ecopBalance)} COP`
              )}
            </div>
            <div className="text-xs text-white/30 mt-0.5">1 ECOP = 1 COP</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
