"use client";

import React, { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import Card, { CardHeader, CardTitle, CardContent } from "./Card";
import Button from "./Button";

const CHAIN_NAMES: Record<number, string> = {
  84532: "Base Sepolia",
  8453: "Base Mainnet",
};

export default function WalletInfo() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [copied, setCopied] = useState(false);

  const chainName = CHAIN_NAMES[chainId] || "Unknown";

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!address) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Address Info */}
      <Card variant="highlight">
        <CardHeader>
          <CardTitle className="text-sm">Wallet Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] break-all">
            <span className="text-sm font-mono text-white/80">{address}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="ml-2 flex-shrink-0"
            >
              {copied ? "✓" : "Copy"}
            </Button>
          </div>
          <div className="text-xs text-white/60">
            Connected to {chainName}
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card variant="highlight">
        <CardHeader>
          <CardTitle className="text-sm">Receive Address QR Code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="p-4 rounded-lg bg-white">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                address,
              )}`}
              alt="Wallet address QR"
              className="w-32 h-32 rounded-md"
            />
          </div>
          <div className="mt-3 text-center text-xs text-white/60 max-w-xs">
            Share this QR code to receive funds on {chainName}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
