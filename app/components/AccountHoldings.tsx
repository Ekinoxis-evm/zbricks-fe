"use client";

import React, { useState } from "react";
import { useReadContract, useAccount } from "wagmi";
import { formatUnits } from "viem";
import { erc20Abi, CONTRACTS, CHAIN_META, ACTIVE_NETWORK } from "@/lib/contracts";
import Image from "next/image";
import Card, { CardContent } from "./Card";
import Button from "./Button";

const USDC_DECIMALS = 6;

export default function AccountHoldings() {
  const { address } = useAccount();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: balanceRaw, isLoading, refetch } = useReadContract({
    address: CONTRACTS.USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
    chainId: ACTIVE_NETWORK,
  });

  const balance = balanceRaw ? parseFloat(formatUnits(balanceRaw, USDC_DECIMALS)) : 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <Card variant="highlight">
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/tokens/usdc.png"
                alt="USDC"
                width={48}
                height={48}
              />
            </div>
            <div>
              <div className="text-xs text-white/50 mb-1 uppercase tracking-wide">
                {CHAIN_META.chainName}
              </div>
              <div className="text-sm text-white/60 mb-1">USDC Balance</div>
              <div className="text-4xl font-bold text-[#2DD4D4]">
                {isLoading ? (
                  <span className="text-2xl text-white/40">Loading...</span>
                ) : (
                  `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
            </div>
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
      </CardContent>
    </Card>
  );
}
