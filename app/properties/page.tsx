"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import Header from "../components/Header";
import PhaseProgressBar from "../components/PhaseProgressBar";

// ============ CONSTANTS ============

const DEFAULT_RPC_BY_CHAIN: Record<number, string> = {
  84532: "https://sepolia.base.org",
  8453: "https://mainnet.base.org",
  5042002: "https://rpc.testnet.arc.network",
};

const CHAIN_DEPLOYMENTS: Record<
  number,
  {
    chainId: number;
    chainName: string;
    explorer: string;
    contracts: { HouseNFT: string };
  }
> = {
  8453: {
    chainId: 8453,
    chainName: "Base Mainnet",
    explorer: "https://base.blockscout.com",
    contracts: { HouseNFT: "0x44b659c474d1bcb0e6325ae17c882994d772e471" },
  },
  84532: {
    chainId: 84532,
    chainName: "Base Sepolia",
    explorer: "https://base-sepolia.blockscout.com",
    contracts: { HouseNFT: "0x3911826c047726de1881f5518faa06e06413aba6" },
  },
  5042002: {
    chainId: 5042002,
    chainName: "Arc Testnet",
    explorer: "https://testnet.arcscan.app",
    contracts: { HouseNFT: "0x6bb77d0b235d4d27f75ae0e3a4f465bf8ac91c0b" },
  },
};

const HOUSE_NFT_ABI = [
  "function nextTokenId() view returns (uint256)",
  "function tokenPhase(uint256) view returns (uint8)",
  "function ownerOf(uint256) view returns (address)",
  "function tokenURI(uint256) view returns (string)",
  "function getPhaseURI(uint256,uint8) view returns (string)",
];

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
      5042002: process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL,
    };
    return envKey[selectedChainId] ?? DEFAULT_RPC_BY_CHAIN[selectedChainId];
  }, [selectedChainId]);

  const rpcProvider = useMemo(
    () => (rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : null),
    [rpcUrl]
  );

  const fetchTokens = useCallback(async () => {
    if (!rpcProvider) return;
    setLoading(true);
    setError("");
    setTokens([]);

    try {
      const nft = new ethers.Contract(
        chainConfig.contracts.HouseNFT,
        HOUSE_NFT_ABI,
        rpcProvider
      );
      const nextId = Number(await nft.nextTokenId());

      if (nextId <= 1) {
        setTokens([]);
        setLoading(false);
        return;
      }

      const results: TokenData[] = [];

      for (let id = 1; id < nextId; id++) {
        try {
          const [phase, owner, uri] = await Promise.all([
            nft.tokenPhase(id),
            nft.ownerOf(id),
            nft.tokenURI(id).catch(() => ""),
          ]);

          const phaseURIs = await Promise.all(
            [0, 1, 2, 3].map((p) =>
              nft.getPhaseURI(id, p).catch(() => "")
            )
          );

          results.push({
            tokenId: id,
            phase: Number(phase),
            owner,
            tokenURI: uri,
            phaseURIs,
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
  }, [rpcProvider, chainConfig]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  async function fetchMetadataPreview(tokenId: number, phaseIdx: number, uri: string) {
    const key = `${tokenId}-${phaseIdx}`;
    if (previews[key]?.data) return; // already loaded

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
        {/* Header */}
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

        {/* Contract info */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">HouseNFT Contract</span>
            <span className="font-mono text-cyan-400">
              {shorten(chainConfig.contracts.HouseNFT)}
            </span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-white/50">Tokens Minted</span>
            <span>{tokens.length}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-white/50">
            Loading tokens from chain...
          </div>
        )}

        {/* Empty state */}
        {!loading && tokens.length === 0 && !error && (
          <div className="text-center py-16 text-white/40">
            No tokens minted yet on {chainConfig.chainName}.
          </div>
        )}

        {/* Token grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {tokens.map((token) => {
            const isExpanded = expandedToken === token.tokenId;
            return (
              <div
                key={token.tokenId}
                className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Token #{token.tokenId}</h3>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Phase {token.phase}
                    </span>
                  </div>

                  {/* Phase progress bar */}
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

                  {/* Expand/collapse */}
                  <button
                    onClick={() =>
                      setExpandedToken(isExpanded ? null : token.tokenId)
                    }
                    className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
                  >
                    {isExpanded ? "Hide Phase URIs" : "Show Phase URIs"}
                  </button>
                </div>

                {/* Expanded: Phase URIs */}
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

                              {/* Inline preview */}
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
