"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http } from "viem";
import { houseNftAbi, CONTRACTS, CHAIN_META } from "@/lib/contracts";
import { activeChain } from "@/lib/wagmi-config";
import Header from "../components/Header";
import PropertyCard from "../components/PropertyCard";
import { fetchNFTMetadataFull } from "@/lib/metadata";
import type { AuctionMeta } from "@/lib/metadata";
import type { Address } from "viem";

// ============ TYPES ============

type TokenData = {
  tokenId: number;
  phase: number;
  owner: string;
  tokenURI: string;
  phaseURIs: string[];
  metadata?: AuctionMeta | null;
};

// ============ HELPERS ============

const shorten = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "-";

// ============ COMPONENT ============

export default function PropertiesPage() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const publicClient = useMemo(
    () => createPublicClient({ chain: activeChain, transport: http(CHAIN_META.rpcDefault) }),
    []
  );

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError("");
    setTokens([]);

    try {
      const nextId = await publicClient.readContract({
        address: CONTRACTS.HouseNFT,
        abi: houseNftAbi,
        functionName: "nextTokenId",
      });

      const nextIdNum = Number(nextId);
      if (nextIdNum <= 1) {
        setTokens([]);
        setLoading(false);
        return;
      }

      const results: TokenData[] = [];

      for (let id = 1; id < nextIdNum; id++) {
        try {
          const tokenResults = await publicClient.multicall({
            contracts: [
              { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "tokenPhase", args: [BigInt(id)] },
              { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "ownerOf", args: [BigInt(id)] },
              { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "tokenURI", args: [BigInt(id)] },
              { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "getPhaseURI", args: [BigInt(id), 0] },
              { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "getPhaseURI", args: [BigInt(id), 1] },
              { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "getPhaseURI", args: [BigInt(id), 2] },
              { address: CONTRACTS.HouseNFT, abi: houseNftAbi, functionName: "getPhaseURI", args: [BigInt(id), 3] },
            ],
          });

          results.push({
            tokenId: id,
            phase: tokenResults[0].result != null ? Number(tokenResults[0].result) : 0,
            owner: (tokenResults[1].result as string) ?? "",
            tokenURI: (tokenResults[2].result as string) ?? "",
            phaseURIs: [
              (tokenResults[3].result as string) ?? "",
              (tokenResults[4].result as string) ?? "",
              (tokenResults[5].result as string) ?? "",
              (tokenResults[6].result as string) ?? "",
            ],
          });
        } catch {
          // Token may not exist
        }
      }

      // Fetch metadata for each token in parallel
      const withMeta = await Promise.all(
        results.map(async (token) => {
          if (!token.tokenURI) return token;
          const meta = await fetchNFTMetadataFull(token.tokenURI);
          return { ...token, metadata: meta };
        })
      );

      setTokens(withMeta);
    } catch (err: any) {
      setError(err?.message || "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Header />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Properties</h1>
            <p className="text-sm text-white/50">
              View all minted tokens, their phases, and metadata URIs
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTokens}
              disabled={loading}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-white/50">HouseNFT Contract</span>
            <a
              href={`${CHAIN_META.explorer}/address/${CONTRACTS.HouseNFT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              {shorten(CONTRACTS.HouseNFT)}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-white/50">Tokens Minted</span>
            <span>{tokens.length}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-white/50">
            Loading tokens from chain...
          </div>
        )}

        {!loading && tokens.length === 0 && !error && (
          <div className="text-center py-16 text-white/40">
            No tokens minted yet on {CHAIN_META.chainName}.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {tokens.map((token) => (
            <PropertyCard
              key={token.tokenId}
              variant="token"
              metadata={token.metadata ?? null}
              currentPhase={token.phase}
              tokenId={token.tokenId}
              tokenData={{
                owner: token.owner,
                tokenURI: token.tokenURI,
                phaseURIs: token.phaseURIs,
              }}
              onClick={() => {
                window.location.href = `/property-detail?tokenId=${token.tokenId}`;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
