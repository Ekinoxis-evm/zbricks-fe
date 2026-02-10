"use client";

import React, { useMemo, useState } from "react";
import { useReadContract, useAccount } from "wagmi";
import { formatUnits } from "viem";
import { erc20Abi, getContractsForChain } from "@/lib/contracts";
import Card, { CardHeader, CardTitle, CardContent } from "./Card";
import Button from "./Button";

const USDC_DECIMALS = 6;
const SUPPORTED_CHAINS = [
  { id: 84532, name: "Base Sepolia", shortName: "Sepolia" },
  { id: 8453, name: "Base Mainnet", shortName: "Base" },
];

interface HoldingsData {
  chainId: number;
  chainName: string;
  shortName: string;
  balance: string | null;
  isLoading: boolean;
}

export default function AccountHoldings() {
  const { address } = useAccount();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBalanceForChain = (chainId: number) => {
    const contracts = getContractsForChain(chainId as any);
    return useReadContract({
      address: contracts.USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      query: { enabled: !!address, refetchInterval: 30000 },
      chainId,
    });
  };

  const sepoliaBalance = fetchBalanceForChain(84532);
  const mainnetBalance = fetchBalanceForChain(8453);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      sepoliaBalance.refetch?.(),
      mainnetBalance.refetch?.(),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const holdings: HoldingsData[] = useMemo(() => {
    return SUPPORTED_CHAINS.map((chain) => {
      const balance = chain.id === 84532 ? sepoliaBalance.data : mainnetBalance.data;
      const isLoading = chain.id === 84532 ? sepoliaBalance.isLoading : mainnetBalance.isLoading;

      return {
        chainId: chain.id,
        chainName: chain.name,
        shortName: chain.shortName,
        balance: balance ? formatUnits(balance, USDC_DECIMALS) : null,
        isLoading,
      };
    });
  }, [sepoliaBalance.data, sepoliaBalance.isLoading, mainnetBalance.data, mainnetBalance.isLoading]);

  const totalBalance = useMemo(() => {
    const total = holdings.reduce((acc, h) => {
      const bal = parseFloat(h.balance || "0");
      return acc + (isNaN(bal) ? 0 : bal);
    }, 0);
    return total.toFixed(2);
  }, [holdings]);

  return (
    <div className="space-y-6">
      {/* Total Holdings Summary */}
      <Card variant="highlight">
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm text-white/60 mb-2">Total USDC Holdings</div>
              <div className="text-5xl font-bold text-[#2DD4D4]">${totalBalance}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-white/50">
                Across {holdings.filter((h) => h.balance && parseFloat(h.balance) > 0).length} chains
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Balances by Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {holdings.map((h) => {
              const balance = h.balance ? parseFloat(h.balance) : 0;

              return (
                <div
                  key={h.chainId}
                  className="rounded-lg p-4 bg-white/[0.02] border border-white/[0.10]"
                >
                  <div className="text-sm font-semibold text-white">{h.chainName}</div>
                  <div className="text-xs text-white/50 mt-1">
                    {h.isLoading ? "Loading..." : `${balance.toFixed(2)} USDC`}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
