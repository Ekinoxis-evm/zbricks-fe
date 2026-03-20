"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { createPublicClient, http } from "viem";
import { houseNftAbi, CONTRACTS, CHAIN_META } from "@/lib/contracts";
import { activeChain } from "@/lib/wagmi-config";
import Header from "../components/Header";
import PropertyDetailPage from "../components/PropertyDetailPage";
import { fetchNFTMetadataFull } from "@/lib/metadata";
import type { AuctionMeta } from "@/lib/metadata";
import type { Address } from "viem";

type TokenDetail = {
  tokenId: number;
  phase: number;
  owner: string;
  tokenURI: string;
  metadata?: AuctionMeta | null;
};

function PropertyDetailContent() {
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams.get("tokenId");
  const tokenId = tokenIdParam ? parseInt(tokenIdParam, 10) : null;

  const [token, setToken] = useState<TokenDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicClient = useMemo(
    () => createPublicClient({ chain: activeChain, transport: http(CHAIN_META.rpcDefault) }),
    []
  );

  useEffect(() => {
    if (!tokenId) {
      setError("Invalid token or chain");
      return;
    }

    const fetchToken = async () => {
      setLoading(true);
      setError(null);

      try {
        const tokenResults = await publicClient.multicall({
          contracts: [
            { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "tokenPhase", args: [BigInt(tokenId)] },
            { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "ownerOf", args: [BigInt(tokenId)] },
            { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "tokenURI", args: [BigInt(tokenId)] },
          ],
        });

        const phase = tokenResults[0].result != null ? Number(tokenResults[0].result) : 0;
        const owner = (tokenResults[1].result as string) ?? "";
        const tokenURI = (tokenResults[2].result as string) ?? "";

        if (!tokenURI) {
          setError("Token metadata URI not available");
          setLoading(false);
          return;
        }

        const metadata = await fetchNFTMetadataFull(tokenURI);

        setToken({
          tokenId,
          phase,
          owner,
          tokenURI,
          metadata,
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load token details");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [publicClient, tokenId, chainId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-4" />
            <p className="text-lg text-white/60">Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <Header />
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Unable to Load Property</h1>
            <p className="text-red-300/80 mb-6">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-black hover:brightness-110"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <Header />
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="text-center">
            <p className="text-white/60">Property not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#030712]">
      <Header />
      <PropertyDetailPage
        metadata={token.metadata ?? null}
        currentPhase={token.phase}
        tokenId={token.tokenId}
        title={token.metadata?.name || (token ? `Token #${token.tokenId}` : "Loading...")}
      />
    </div>
  );
}

export default function PropertyDetailViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] text-white">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-xl text-white/40">Loading...</div>
          </div>
        </div>
      </div>
    }>
      <PropertyDetailContent />
    </Suspense>
  );
}
