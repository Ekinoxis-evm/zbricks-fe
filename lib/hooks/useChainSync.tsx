"use client";

import { useEffect, useMemo } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { getContractsForChain, getChainMeta, type SupportedChainId } from "../contracts";

/**
 * Hook to manage chain synchronization between wallet and app
 * Provides contracts, chain info, and utilities for handling chain mismatches
 */
export function useChainSync(preferredChainId?: SupportedChainId) {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  // Determine the active chain
  const activeChainId = useMemo(() => {
    // If wallet is connected, use wallet's chain (if supported)
    if (isConnected && walletChainId) {
      const isSupportedChain = walletChainId === 8453 || walletChainId === 84532;
      if (isSupportedChain) {
        return walletChainId as SupportedChainId;
      }
    }
    // Fall back to preferred or default
    return preferredChainId || 84532;
  }, [isConnected, walletChainId, preferredChainId]);

  // Check if there's a chain mismatch
  const isChainMismatch = useMemo(() => {
    if (!isConnected || !walletChainId) return false;
    if (preferredChainId) {
      return walletChainId !== preferredChainId;
    }
    // No mismatch if wallet is on a supported chain
    return walletChainId !== 8453 && walletChainId !== 84532;
  }, [isConnected, walletChainId, preferredChainId]);

  // Get contracts for the active chain
  const contracts = useMemo(() => {
    return getContractsForChain(activeChainId);
  }, [activeChainId]);

  // Get chain metadata
  const chainMeta = useMemo(() => {
    return getChainMeta(activeChainId);
  }, [activeChainId]);

  // Get wagmi chain object
  const chain = useMemo(() => {
    return activeChainId === 8453 ? base : baseSepolia;
  }, [activeChainId]);

  // Function to switch to a specific chain
  const switchToChain = async (targetChainId: SupportedChainId) => {
    if (!isConnected) {
      console.warn("Cannot switch chain: wallet not connected");
      return;
    }
    try {
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      console.error("Failed to switch chain:", error);
      throw error;
    }
  };

  return {
    // Chain info
    activeChainId,
    chain,
    chainMeta,
    contracts,

    // Connection state
    isConnected,
    address,
    walletChainId,

    // Chain mismatch handling
    isChainMismatch,
    isSwitching,
    switchToChain,

    // Helper to check if on correct chain
    isCorrectChain: !isChainMismatch,
  };
}

/**
 * Component to display when user needs to switch chains
 */
export function ChainMismatchWarning({
  targetChainId,
  onSwitch,
}: {
  targetChainId: SupportedChainId;
  onSwitch: () => void;
}) {
  const chainName = targetChainId === 8453 ? "Base Mainnet" : "Base Sepolia";

  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-300">Wrong Network</h3>
          <p className="mt-1 text-sm text-yellow-200/80">
            Please switch to {chainName} to use this feature.
          </p>
          <button
            onClick={onSwitch}
            className="mt-3 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-yellow-400"
          >
            Switch to {chainName}
          </button>
        </div>
      </div>
    </div>
  );
}
