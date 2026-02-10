"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChainSync } from "./useChainSync";

/**
 * Centralized wallet connection hook that provides:
 * - Consistent connection state across all pages
 * - Automatic redirect to home page if not connected
 * - Chain validation and switching
 * - Connection status utilities
 */
export function useWalletConnection(options?: {
  requireConnection?: boolean;
  redirectPath?: string;
  preferredChainId?: 84532 | 8453;
}) {
  const {
    requireConnection = false,
    redirectPath = "/",
    preferredChainId,
  } = options || {};

  const router = useRouter();
  
  const chainSync = useChainSync(preferredChainId);
  const {
    isConnected,
    address,
    activeChainId,
    chainMeta,
    contracts,
    isChainMismatch,
    switchToChain,
    isSwitching,
  } = chainSync;

  // Redirect to specified path if connection is required but not present
  useEffect(() => {
    if (requireConnection && !isConnected) {
      router.push(redirectPath);
    }
  }, [requireConnection, isConnected, router, redirectPath]);

  // Connection status helpers
  const connectionStatus = useMemo(() => {
    if (!isConnected) {
      return {
        status: "disconnected" as const,
        message: "Wallet not connected",
        canInteract: false,
      };
    }

    if (isChainMismatch) {
      return {
        status: "wrong-chain" as const,
        message: `Please switch to ${chainMeta.chainName}`,
        canInteract: false,
      };
    }

    return {
      status: "connected" as const,
      message: `Connected to ${chainMeta.chainName}`,
      canInteract: true,
    };
  }, [isConnected, isChainMismatch, chainMeta.chainName]);

  // Helper to ensure user is on the correct chain
  const ensureCorrectChain = useCallback(async () => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    if (isChainMismatch && preferredChainId) {
      await switchToChain(preferredChainId);
    }

    return true;
  }, [isConnected, isChainMismatch, preferredChainId, switchToChain]);

  // Helper to check if user can perform transactions
  const canTransact = useMemo(() => {
    return isConnected && !isChainMismatch;
  }, [isConnected, isChainMismatch]);

  return {
    // Connection state
    isConnected,
    address,
    connectionStatus,

    // Chain state
    activeChainId,
    chainMeta,
    contracts,
    isChainMismatch,
    isSwitching,

    // Actions
    switchToChain,
    ensureCorrectChain,

    // Helpers
    canTransact,

    // Additional chain sync properties
    chain: chainSync.chain,
    walletChainId: chainSync.walletChainId,
    isCorrectChain: chainSync.isCorrectChain,
  };
}

/**
 * Hook specifically for pages that require wallet connection
 * Automatically redirects to home page if not connected
 */
export function useRequireWallet(preferredChainId?: 84532 | 8453) {
  return useWalletConnection({
    requireConnection: true,
    preferredChainId,
  });
}

/**
 * Hook for pages that work with or without wallet
 * but need to check connection status
 */
export function useOptionalWallet(preferredChainId?: 84532 | 8453) {
  return useWalletConnection({
    requireConnection: false,
    preferredChainId,
  });
}
