"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http } from "viem";
import { baseSepolia, base } from "viem/chains";
import { houseNftAbi, getContractsForChain } from "@/lib/contracts";
import Header from "../components/Header";
import PhaseProgressBar from "../components/PhaseProgressBar";
import type { Address } from "viem";

// ============ CONSTANTS ============

const DEFAULT_RPC_BY_CHAIN: Record<number, string> = {
  84532: "https://sepolia.base.org",
  8453: "https://mainnet.base.org",
};

const CHAIN_MAP: Record<number, typeof baseSepolia> = {
  84532: baseSepolia,
  8453: base,
};

// Only allow chains from addresses.json
const CHAIN_DEPLOYMENTS: Record<
  number,
  {
    chainId: number;
    chainName: string;
    explorer: string;
    contracts: { HouseNFT: Address };
  }
> = {
  8453: {
    chainId: 8453,
    chainName: "Base Mainnet",
    explorer: "https://base.blockscout.com",
    contracts: { HouseNFT: getContractsForChain(8453).HouseNFT },
  },
  84532: {
    chainId: 84532,
    chainName: "Base Sepolia",
    explorer: "https://base-sepolia.blockscout.com",
    contracts: { HouseNFT: getContractsForChain(84532).HouseNFT },
  },
};

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// ============ TYPES ============

type TokenData = {
  tokenId: number;
  phase: number;
  owner: string;
  tokenURI: string;
  phaseURIs: string[];
};

type MetadataPreview = {
  tokenId: number;
  phaseIdx: number;
  data: any;
  loading: boolean;
  error: string;
};

// ============ HELPERS ============

const shorten = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "-";

function ipfsToHttp(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return IPFS_GATEWAY + uri.slice(7);
  return uri;
}

// ============ COMPONENT ============

export default function PropertiesPage() {
  const [selectedChainId, setSelectedChainId] = useState<number>(84532);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedToken, setExpandedToken] = useState<number | null>(null);
  const [previews, setPreviews] = useState<Record<string, MetadataPreview>>({});

  const chainConfig = CHAIN_DEPLOYMENTS[selectedChainId];

  const rpcUrl = useMemo(() => {
    const envKey: Record<number, string | undefined> = {
      84532: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
      8453: process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL,
    };
    return envKey[selectedChainId] ?? DEFAULT_RPC_BY_CHAIN[selectedChainId];
  }, [selectedChainId]);

  const publicClient = useMemo(() => {
    if (!rpcUrl) return null;
    const chain = CHAIN_MAP[selectedChainId] ?? baseSepolia;
    return createPublicClient({ chain, transport: http(rpcUrl) });
  }, [rpcUrl, selectedChainId]);

  const fetchTokens = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    setError("");
    setTokens([]);

    try {
      const nextId = await publicClient.readContract({
        address: chainConfig.contracts.HouseNFT,
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
              { address: chainConfig.contracts.HouseNFT, abi: houseNftAbi, functionName: "tokenPhase", args: [BigInt(id)] },
              { address: chainConfig.contracts.HouseNFT, abi: houseNftAbi, functionName: "ownerOf", args: [BigInt(id)] },
              { address: chainConfig.contracts.HouseNFT, abi: houseNftAbi, functionName: "tokenURI", args: [BigInt(id)] },
              { address: chainConfig.contracts.HouseNFT, abi: houseNftAbi, functionName: "getPhaseURI", args: [BigInt(id), 0] },
              { address: chainConfig.contracts.HouseNFT, abi: houseNftAbi, functionName: "getPhaseURI", args: [BigInt(id), 1] },
              { address: chainConfig.contracts.HouseNFT, abi: houseNftAbi, functionName: "getPhaseURI", args: [BigInt(id), 2] },
              { address: chainConfig.contracts.HouseNFT, abi: houseNftAbi, functionName: "getPhaseURI", args: [BigInt(id), 3] },
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

      setTokens(results);
    } catch (err: any) {
      setError(err?.message || "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  }, [publicClient, chainConfig]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  async function fetchMetadataPreview(tokenId: number, phaseIdx: number, uri: string) {
    const key = `${tokenId}-${phaseIdx}`;
    if (previews[key]?.data) return;

    setPreviews((p) => ({
      ...p,
      [key]: { tokenId, phaseIdx, data: null, loading: true, error: "" },
    }));

    try {
      const httpUrl = ipfsToHttp(uri);
      const res = await fetch(httpUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPreviews((p) => ({
        ...p,
        [key]: { tokenId, phaseIdx, data, loading: false, error: "" },
      }));
    } catch (err: any) {
      setPreviews((p) => ({
        ...p,
        [key]: {
          tokenId,
          phaseIdx,
          data: null,
          loading: false,
          error: err?.message || "Failed to fetch",
        },
      }));
    }
  }

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
            <select
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              value={selectedChainId}
              onChange={(e) => setSelectedChainId(Number(e.target.value))}
            >
              {Object.values(CHAIN_DEPLOYMENTS).map((c) => (
                <option key={c.chainId} value={c.chainId}>
                  {c.chainName}
                </option>
              ))}
            </select>

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
              href={`${chainConfig.explorer}/address/${chainConfig.contracts.HouseNFT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              {shorten(chainConfig.contracts.HouseNFT)}
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
            No tokens minted yet on {chainConfig.chainName}.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {tokens.map((token) => {
            const isExpanded = expandedToken === token.tokenId;
            return (
              <div
                key={token.tokenId}
                className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Token #{token.tokenId}</h3>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Phase {token.phase}
                    </span>
                  </div>

                  <PhaseProgressBar phase={token.phase} variant="expanded" />

                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/50">Owner</span>
                      <span className="font-mono">{shorten(token.owner)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Current URI</span>
                      <span className="truncate ml-4 max-w-[200px] text-white/70">
                        {token.tokenURI || "-"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setExpandedToken(isExpanded ? null : token.tokenId)
                    }
                    className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
                  >
                    {isExpanded ? "Hide Phase URIs" : "Show Phase URIs"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-5 space-y-3">
                    {token.phaseURIs.map((uri, idx) => {
                      const previewKey = `${token.tokenId}-${idx}`;
                      const preview = previews[previewKey];
                      const hasUri = !!uri;

                      return (
                        <div
                          key={idx}
                          className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold">
                              Phase {idx} URI
                            </div>
                            <div
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                hasUri
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-white/5 text-white/30"
                              }`}
                            >
                              {hasUri ? "Set" : "Not set"}
                            </div>
                          </div>

                          {hasUri ? (
                            <>
                              <div className="mt-1 text-xs text-white/60 truncate font-mono">
                                {uri}
                              </div>
                              <div className="mt-2 flex gap-2">
                                <a
                                  href={ipfsToHttp(uri)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-cyan-400 hover:underline"
                                >
                                  Open in Gateway
                                </a>
                                <button
                                  onClick={() =>
                                    fetchMetadataPreview(
                                      token.tokenId,
                                      idx,
                                      uri
                                    )
                                  }
                                  className="text-[11px] text-cyan-400 hover:underline"
                                >
                                  {preview?.loading
                                    ? "Loading..."
                                    : preview?.data
                                    ? "Refresh Preview"
                                    : "Preview"}
                                </button>
                              </div>

                              {preview?.error && (
                                <div className="mt-2 text-xs text-red-300">
                                  {preview.error}
                                </div>
                              )}
                              {preview?.data && (
                                <pre className="mt-2 max-h-[200px] overflow-auto rounded-lg border border-white/5 bg-black/40 p-2 text-[10px] text-white/70">
                                  {JSON.stringify(preview.data, null, 2)}
                                </pre>
                              )}
                            </>
                          ) : (
                            <div className="mt-1 text-xs text-white/30">
                              No URI configured for this phase.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
