"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import Button from "./Button";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !address) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Wallet Address",
        text: `Send funds to my wallet: ${address}`,
        url: window.location.href,
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl max-w-sm w-full p-8 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
          {/* Close Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Receive USDC</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-xl bg-white">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  address,
                )}`}
                alt="Wallet address QR"
                className="w-48 h-48 rounded-lg"
              />
            </div>
          </div>

          {/* Address Display */}
          <div className="mb-6">
            <div className="text-xs text-white/60 font-medium mb-2">Your Address</div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.05] border border-white/[0.08] break-all">
              <span className="text-sm font-mono text-white/90 flex-1">{address}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              fullWidth
              onClick={handleCopy}
              size="sm"
            >
              {copied ? "✓ Copied" : "Copy Address"}
            </Button>
            {navigator.share && (
              <Button
                variant="secondary"
                fullWidth
                onClick={handleShare}
                size="sm"
              >
                Share
              </Button>
            )}
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            fullWidth
            onClick={onClose}
            className="mt-3"
          >
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
