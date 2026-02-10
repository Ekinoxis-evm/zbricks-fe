"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { isAddress, parseUnits, formatUnits, createPublicClient, http } from "viem";
import { auctionAbi, erc20Abi, houseNftAbi, factoryAbi } from "@/lib/contracts";
import { useChainSync, ChainMismatchWarning } from "@/lib/hooks/useChainSync";
import Header from "../components/Header";
import PhaseProgressBar from "../components/PhaseProgressBar";
import PhaseMetadataBuilder from "../components/PhaseMetadataBuilder";

// ============ TYPES ============

type Tab = "nft" | "launch" | "manage";

type Toast = {
  id: string;
  type: "info" | "success" | "error";
  title: string;
  detail?: string;
};

// ============ HELPERS ============

const shorten = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "-");

// ============ COMPONENT ============

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("nft");
  const { writeContractAsync } = useWriteContract();
  
  // Use chain sync hook for proper connection management
  const {
    activeChainId,
    chain,
    chainMeta,
    contracts,
    isConnected,
    address: walletAddress,
    isChainMismatch,
    switchToChain,
  } = useChainSync(84532); // Prefer Base Sepolia for admin

  const hasSession = isConnected && !!walletAddress;

  const publicClient = useMemo(
    () => createPublicClient({ chain, transport: http(chainMeta.rpcDefault) }),
    [chain, chainMeta.rpcDefault]
  );

  // UI
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // NFT State
  const [nftAdmin, setNftAdmin] = useState("");
  const [nftNextTokenId, setNftNextTokenId] = useState<bigint | null>(null);
  const [nftTokenId, setNftTokenId] = useState("1");
  const [nftTokenPhase, setNftTokenPhase] = useState<number | null>(null);
  const [nftTokenController, setNftTokenController] = useState("");
  const [nftTokenOwner, setNftTokenOwner] = useState("");
  const [nftTokenUri, setNftTokenUri] = useState("");

  // NFT Actions
  const [mintRecipient, setMintRecipient] = useState("");
  const [setControllerAddr, setSetControllerAddr] = useState("");
  const [phaseUris, setPhaseUris] = useState(["", "", "", ""]);
  const [singlePhaseIdx, setSinglePhaseIdx] = useState("0");
  const [singlePhaseUri, setSinglePhaseUri] = useState("");
  const [transferAdminAddr, setTransferAdminAddr] = useState("");
  const [showBuilder, setShowBuilder] = useState<number | null>(null);

  // Factory State
  const [factoryOwner, setFactoryOwner] = useState("");
  const [auctionsList, setAuctionsList] = useState<string[]>([]);

  // Launch Auction
  const [launchNftContract, setLaunchNftContract] = useState("");
  const [launchTokenId, setLaunchTokenId] = useState("1");
  const [launchPaymentToken, setLaunchPaymentToken] = useState("");
  const [launchPhaseDurations, setLaunchPhaseDurations] = useState(["86400", "86400", "86400", "0"]);
  const [launchFloorPrice, setLaunchFloorPrice] = useState("100");
  const [launchMinIncrement, setLaunchMinIncrement] = useState("5");
  const [launchEnforceIncrement, setLaunchEnforceIncrement] = useState(true);
  const [launchParticipationFee, setLaunchParticipationFee] = useState("0");
  const [launchTreasury, setLaunchTreasury] = useState("");

  // Manage Auction State
  const [selectedAuction, setSelectedAuction] = useState("");
  const [auctionOwner, setAuctionOwner] = useState("");
  const [auctionPhase, setAuctionPhase] = useState<number | null>(null);
  const [auctionLeader, setAuctionLeader] = useState("");
  const [auctionHighBid, setAuctionHighBid] = useState<bigint | null>(null);
  const [auctionFloorPrice, setAuctionFloorPrice] = useState<bigint | null>(null);
  const [auctionParticipationFee, setAuctionParticipationFee] = useState<bigint | null>(null);
  const [auctionMinIncrement, setAuctionMinIncrement] = useState<bigint | null>(null);
  const [auctionWinner, setAuctionWinner] = useState("");
  const [auctionFinalized, setAuctionFinalized] = useState<boolean | null>(null);
  const [auctionPaused, setAuctionPaused] = useState<boolean | null>(null);
  const [auctionTimeRemaining, setAuctionTimeRemaining] = useState<bigint | null>(null);
  const [auctionBidderCount, setAuctionBidderCount] = useState<number | null>(null);
  const [emergencyWithdrawTo, setEmergencyWithdrawTo] = useState("");

  const isNftAdmin = hasSession && nftAdmin && walletAddress!.toLowerCase() === nftAdmin.toLowerCase();
  const isFactoryOwner = hasSession && factoryOwner && walletAddress!.toLowerCase() === factoryOwner.toLowerCase();
  const isAuctionOwner = hasSession && auctionOwner && walletAddress!.toLowerCase() === auctionOwner.toLowerCase();

  // ============ TOAST ============

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  // ============ CONTRACT TX HELPER ============

  const runTx = useCallback(
    async (
      label: string,
      params: Parameters<typeof writeContractAsync>[0]
    ) => {
      if (!walletAddress) {
        pushToast({ type: "error", title: "Connect wallet first", detail: "Please connect your wallet using the button in the header" });
        return null;
      }

      setIsLoading(true);
      try {
        pushToast({ type: "info", title: `${label} pending...`, detail: "Approve in your wallet" });
        const hash = await writeContractAsync(params);
        pushToast({
          type: "success",
          title: `${label} confirmed`,
          detail: hash ? `TX: ${hash.slice(0, 14)}...` : undefined
        });
        return hash;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Transaction failed";
        pushToast({ type: "error", title: label, detail: msg });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pushToast, walletAddress, writeContractAsync]
  );

  // ============ REFRESH DATA ============

  const refreshData = useCallback(async () => {
    try {
      // NFT Data
      try {
        const nftResults = await publicClient.multicall({
          contracts: [
            { address: contracts.HouseNFT, abi: houseNftAbi, functionName: "admin" },
            { address: contracts.HouseNFT, abi: houseNftAbi, functionName: "nextTokenId" },
          ],
        });

        setNftAdmin((nftResults[0].result as string) ?? "");
        setNftNextTokenId(nftResults[1].result as bigint ?? null);

        const tokenId = BigInt(nftTokenId || "1");
        try {
          const tokenResults = await publicClient.multicall({
            contracts: [
              { address: contracts.HouseNFT, abi: houseNftAbi, functionName: "tokenPhase", args: [tokenId] },
              { address: contracts.HouseNFT, abi: houseNftAbi, functionName: "tokenController", args: [tokenId] },
              { address: contracts.HouseNFT, abi: houseNftAbi, functionName: "ownerOf", args: [tokenId] },
              { address: contracts.HouseNFT, abi: houseNftAbi, functionName: "tokenURI", args: [tokenId] },
            ],
          });

          setNftTokenPhase(tokenResults[0].result != null ? Number(tokenResults[0].result) : null);
          setNftTokenController((tokenResults[1].result as string) ?? "");
          setNftTokenOwner((tokenResults[2].result as string) ?? "");
          setNftTokenUri((tokenResults[3].result as string) ?? "");
        } catch {
          setNftTokenPhase(null);
          setNftTokenController("");
          setNftTokenOwner("");
          setNftTokenUri("");
        }
      } catch (error) {
        console.error("Error loading NFT data:", error);
      }

      // Factory Data
      try {
        const factoryResults = await publicClient.multicall({
          contracts: [
            { address: contracts.AuctionFactory, abi: factoryAbi, functionName: "owner" },
            { address: contracts.AuctionFactory, abi: factoryAbi, functionName: "getAuctions" },
          ],
        });

        setFactoryOwner((factoryResults[0].result as string) ?? "");
        setAuctionsList((factoryResults[1].result as string[]) ?? []);
      } catch (error) {
        console.error("Error loading Factory data:", error);
      }

      // Set defaults
      if (!launchNftContract) setLaunchNftContract(contracts.HouseNFT);
      if (!launchPaymentToken) setLaunchPaymentToken(contracts.USDC);
      if (!launchTreasury && walletAddress) setLaunchTreasury(walletAddress);

      // Auction Data
      try {
        const auctionAddr = (selectedAuction || contracts.AuctionManager) as `0x${string}`;
        if (auctionAddr) {
          const auctionResults = await publicClient.multicall({
            contracts: [
              { address: auctionAddr, abi: auctionAbi, functionName: "owner" },
              { address: auctionAddr, abi: auctionAbi, functionName: "currentPhase" },
              { address: auctionAddr, abi: auctionAbi, functionName: "currentLeader" },
              { address: auctionAddr, abi: auctionAbi, functionName: "currentHighBid" },
              { address: auctionAddr, abi: auctionAbi, functionName: "floorPrice" },
              { address: auctionAddr, abi: auctionAbi, functionName: "participationFee" },
              { address: auctionAddr, abi: auctionAbi, functionName: "minBidIncrementPercent" },
              { address: auctionAddr, abi: auctionAbi, functionName: "winner" },
              { address: auctionAddr, abi: auctionAbi, functionName: "finalized" },
              { address: auctionAddr, abi: auctionAbi, functionName: "paused" },
              { address: auctionAddr, abi: auctionAbi, functionName: "getTimeRemaining" },
              { address: auctionAddr, abi: auctionAbi, functionName: "getBidderCount" },
            ],
          });

          setAuctionOwner((auctionResults[0].result as string) ?? "");
          setAuctionPhase(auctionResults[1].result != null ? Number(auctionResults[1].result) : null);
          setAuctionLeader((auctionResults[2].result as string) ?? "");
          setAuctionHighBid(auctionResults[3].result as bigint ?? null);
          setAuctionFloorPrice(auctionResults[4].result as bigint ?? null);
          setAuctionParticipationFee(auctionResults[5].result as bigint ?? 0n);
          setAuctionMinIncrement(auctionResults[6].result as bigint ?? 0n);
          setAuctionWinner((auctionResults[7].result as string) ?? "");
          setAuctionFinalized(auctionResults[8].result as boolean ?? null);
          setAuctionPaused(auctionResults[9].result as boolean ?? null);
          setAuctionTimeRemaining(auctionResults[10].result as bigint ?? null);
          setAuctionBidderCount(auctionResults[11].result != null ? Number(auctionResults[11].result) : null);
        }
      } catch (error) {
        console.error("Error loading Auction data:", error);
      }
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error refreshing data:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      pushToast({ type: "error", title: "Failed to load data", detail: errorMsg });
    }
  }, [publicClient, nftTokenId, selectedAuction, launchNftContract, launchPaymentToken, launchTreasury, walletAddress, pushToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ============ NFT ACTIONS ============

  const handleMint = async () => {
    if (!isAddress(mintRecipient)) {
      pushToast({ type: "error", title: "Invalid recipient" });
      return;
    }
    await runTx("Mint NFT", {
      address: contracts.HouseNFT,
      abi: houseNftAbi,
      functionName: "mintTo",
      args: [mintRecipient as `0x${string}`],
    });
    refreshData();
  };

  const handleSetController = async () => {
    if (!isAddress(setControllerAddr)) {
      pushToast({ type: "error", title: "Invalid controller address" });
      return;
    }
    await runTx("Set Controller", {
      address: contracts.HouseNFT,
      abi: houseNftAbi,
      functionName: "setController",
      args: [BigInt(nftTokenId), setControllerAddr as `0x${string}`],
    });
    refreshData();
  };

  const handleSetPhaseUris = async () => {
    if (phaseUris.some((u) => !u.trim())) {
      pushToast({ type: "error", title: "Fill all 4 URIs" });
      return;
    }
    await runTx("Set Phase URIs", {
      address: contracts.HouseNFT,
      abi: houseNftAbi,
      functionName: "setPhaseURIs",
      args: [BigInt(nftTokenId), phaseUris as [string, string, string, string]],
    });
    refreshData();
  };

  const handleUpdateSingleUri = async () => {
    if (!singlePhaseUri.trim()) {
      pushToast({ type: "error", title: "URI required" });
      return;
    }
    await runTx("Update Phase URI", {
      address: contracts.HouseNFT,
      abi: houseNftAbi,
      functionName: "updatePhaseURI",
      args: [BigInt(nftTokenId), Number(singlePhaseIdx), singlePhaseUri],
    });
    refreshData();
  };

  const handleAdvanceNftPhase = async () => {
    await runTx("Advance NFT Phase", {
      address: contracts.HouseNFT,
      abi: houseNftAbi,
      functionName: "advancePhase",
      args: [BigInt(nftTokenId)],
    });
    refreshData();
  };

  const handleTransferNftToFactory = async () => {
    if (!walletAddress) return;
    await runTx("Transfer NFT to Factory", {
      address: contracts.HouseNFT,
      abi: houseNftAbi,
      functionName: "safeTransferFrom",
      args: [walletAddress, contracts.AuctionFactory, BigInt(nftTokenId)],
    });
    refreshData();
  };

  const handleTransferAdmin = async () => {
    if (!isAddress(transferAdminAddr)) {
      pushToast({ type: "error", title: "Invalid admin address" });
      return;
    }
    await runTx("Transfer Admin", {
      address: contracts.HouseNFT,
      abi: houseNftAbi,
      functionName: "transferAdmin",
      args: [transferAdminAddr as `0x${string}`],
    });
    refreshData();
  };

  // ============ LAUNCH AUCTION ============

  const handleLaunchAuction = async () => {
    if (!isAddress(launchNftContract) || !isAddress(launchPaymentToken) || !isAddress(launchTreasury)) {
      pushToast({ type: "error", title: "Invalid addresses" });
      return;
    }

    // Verify NFT is owned by the factory
    try {
      const owner = await publicClient.readContract({
        address: launchNftContract as `0x${string}`,
        abi: houseNftAbi,
        functionName: "ownerOf",
        args: [BigInt(launchTokenId)],
      });

      if ((owner as string).toLowerCase() !== contracts.AuctionFactory.toLowerCase()) {
        pushToast({
          type: "error",
          title: "NFT not transferred",
          detail: "Transfer the NFT to the Factory first (see Manage NFT tab)"
        });
        return;
      }
    } catch (error) {
      console.error("Error checking NFT owner:", error);
      pushToast({
        type: "error",
        title: "Cannot verify NFT",
        detail: "Make sure the NFT contract and token ID are correct"
      });
      return;
    }

    const durations = launchPhaseDurations.map((d) => BigInt(d || "0")) as [bigint, bigint, bigint, bigint];
    const floorPrice = parseUnits(launchFloorPrice || "0", 6);
    const participationFee = parseUnits(launchParticipationFee || "0", 6);

    const result = await runTx("Create Auction", {
      address: contracts.AuctionFactory,
      abi: factoryAbi,
      functionName: "createAuction",
      args: [
        walletAddress!,
        launchPaymentToken as `0x${string}`,
        launchNftContract as `0x${string}`,
        BigInt(launchTokenId),
        durations,
        floorPrice,
        BigInt(launchMinIncrement),
        launchEnforceIncrement,
        participationFee,
        launchTreasury as `0x${string}`,
      ],
    });

    if (result) {
      pushToast({
        type: "success",
        title: "Auction created!",
        detail: "Check Auctions page for the new auction"
      });
    }
  };

  // ============ MANAGE AUCTION ============

  const handleAuctionAction = async (label: string, functionName: string, args: unknown[] = []) => {
    const addr = (selectedAuction || contracts.AuctionManager) as `0x${string}`;
    await runTx(label, {
      address: addr,
      abi: auctionAbi,
      functionName: functionName as any,
      args: args as any,
    });
    refreshData();
  };

  // ============ RENDER ============

  const formatTime = (seconds: bigint | null) => {
    if (seconds === null) return "-";
    const s = Number(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatUsdcDisplay = (amount: bigint | null) => {
    if (amount === null) return "-";
    return formatUnits(amount, 6);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Header />

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Chain Mismatch Warning */}
        {isChainMismatch && (
          <div className="mb-6">
            <ChainMismatchWarning
              targetChainId={84532}
              onSwitch={() => switchToChain(84532)}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-white/50">
              Manage NFTs, Launch & Control Auctions on {chainMeta.chainName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Refresh
            </button>
            {lastRefreshed && (
              <span className="text-xs text-white/40">
                Last: {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Session Status */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <div className={`rounded-full px-3 py-1 ${hasSession ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
            {hasSession ? `Connected: ${shorten(walletAddress!)}` : "Not connected"}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          {[
            { id: "nft", label: "Manage NFT" },
            { id: "launch", label: "Launch Auction" },
            { id: "manage", label: "Manage Auction" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-cyan-500 text-black"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============ MANAGE NFT TAB ============ */}
        {activeTab === "nft" && (
          <div className="space-y-6">
            {/* NFT Info */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="text-lg font-semibold mb-4">HouseNFT Contract</h2>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Address</span>
                  <span className="font-mono">{shorten(contracts.HouseNFT)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Admin</span>
                  <span className={isNftAdmin ? "text-emerald-400" : ""}>{shorten(nftAdmin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Next Token ID</span>
                  <span>{nftNextTokenId?.toString() ?? "-"}</span>
                </div>
              </div>
            </div>

            {/* Token Query */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-3">Query Token</h3>
              <div className="flex gap-3 mb-4">
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  placeholder="Token ID"
                  value={nftTokenId}
                  onChange={(e) => setNftTokenId(e.target.value)}
                />
                <button onClick={refreshData} className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
                  Query
                </button>
              </div>
              <div className="grid gap-2 text-sm text-white/70">
                <div>Phase: <span className="text-white">{nftTokenPhase ?? "-"}</span></div>
                <div>Controller: <span className="text-white font-mono">{shorten(nftTokenController)}</span></div>
                <div>Owner: <span className="text-white font-mono">{shorten(nftTokenOwner)}</span></div>
                <div className="truncate">URI: <span className="text-white">{nftTokenUri || "-"}</span></div>
              </div>
            </div>

            {/* Mint */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-3">Mint NFT</h3>
              <div className="flex gap-3">
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  placeholder="Recipient address"
                  value={mintRecipient}
                  onChange={(e) => setMintRecipient(e.target.value)}
                />
                <button
                  onClick={handleMint}
                  disabled={!isNftAdmin || isLoading}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  Mint
                </button>
              </div>
              {!isNftAdmin && <p className="mt-2 text-xs text-red-400">Only NFT admin can mint</p>}
            </div>

            {/* Set Controller */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-3">Set Controller (for Token #{nftTokenId})</h3>
              <div className="flex gap-3">
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  placeholder="Controller address (usually AuctionManager)"
                  value={setControllerAddr}
                  onChange={(e) => setSetControllerAddr(e.target.value)}
                />
                <button
                  onClick={handleSetController}
                  disabled={!isNftAdmin || isLoading}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>

            {/* Set Phase URIs */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-3">Set Phase URIs (Token #{nftTokenId})</h3>
              <div className="grid gap-2 mb-3">
                {phaseUris.map((uri, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                      placeholder={`Phase ${i} URI (ipfs://...)`}
                      value={uri}
                      onChange={(e) => {
                        const next = [...phaseUris];
                        next[i] = e.target.value;
                        setPhaseUris(next);
                      }}
                    />
                    <button
                      onClick={() => setShowBuilder(showBuilder === i ? null : i)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                        showBuilder === i
                          ? "bg-cyan-600 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/15"
                      }`}
                    >
                      {showBuilder === i ? "Close Builder" : "Build"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Inline Metadata Builder */}
              {showBuilder !== null && (
                <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-cyan-300">
                      Metadata Builder &mdash; Phase {showBuilder}
                    </h4>
                    <button
                      onClick={() => setShowBuilder(null)}
                      className="text-xs text-white/50 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <PhaseMetadataBuilder
                    singlePhase={showBuilder}
                    onUploaded={(phaseIndex, ipfsUri) => {
                      const next = [...phaseUris];
                      next[phaseIndex] = ipfsUri;
                      setPhaseUris(next);
                    }}
                  />
                </div>
              )}

              <button
                onClick={handleSetPhaseUris}
                disabled={!isNftAdmin || isLoading}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
              >
                Set All URIs
              </button>
            </div>

            {/* Update Single URI */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-3">Update Single Phase URI</h3>
              <div className="flex gap-3 mb-3">
                <select
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={singlePhaseIdx}
                  onChange={(e) => setSinglePhaseIdx(e.target.value)}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <option key={i} value={i}>Phase {i}</option>
                  ))}
                </select>
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  placeholder="New URI"
                  value={singlePhaseUri}
                  onChange={(e) => setSinglePhaseUri(e.target.value)}
                />
                <button
                  onClick={handleUpdateSingleUri}
                  disabled={!isNftAdmin || isLoading}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Advance Phase & Transfer */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <h3 className="font-semibold mb-3">Advance NFT Phase</h3>
                <p className="text-xs text-white/50 mb-3">Current phase: {nftTokenPhase ?? "-"}</p>
                <button
                  onClick={handleAdvanceNftPhase}
                  disabled={!isNftAdmin || isLoading}
                  className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  Advance Phase
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <h3 className="font-semibold mb-3">Transfer NFT to Factory</h3>
                <p className="text-xs text-white/50 mb-3">Required before creating auction</p>
                <button
                  onClick={handleTransferNftToFactory}
                  disabled={isLoading}
                  className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  Transfer to Factory
                </button>
              </div>
            </div>

            {/* Transfer Admin */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-3">Transfer NFT Admin</h3>
              <div className="flex gap-3">
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  placeholder="New admin address"
                  value={transferAdminAddr}
                  onChange={(e) => setTransferAdminAddr(e.target.value)}
                />
                <button
                  onClick={handleTransferAdmin}
                  disabled={!isNftAdmin || isLoading}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ LAUNCH AUCTION TAB ============ */}
        {activeTab === "launch" && (
          <div className="space-y-6">
            {/* Factory Info */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="text-lg font-semibold mb-4">AuctionFactory</h2>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Address</span>
                  <span className="font-mono">{shorten(contracts.AuctionFactory)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Owner</span>
                  <span className={isFactoryOwner ? "text-emerald-400" : ""}>{shorten(factoryOwner)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Auctions Created</span>
                  <span>{auctionsList.length}</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <strong>Important:</strong> Before creating an auction, the NFT must be transferred to the Factory contract.
              Use the &quot;Transfer NFT to Factory&quot; button in the Manage NFT tab.
            </div>

            {/* Launch Form */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-4">Create New Auction</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">NFT Contract</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={launchNftContract}
                    onChange={(e) => setLaunchNftContract(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Token ID</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={launchTokenId}
                    onChange={(e) => setLaunchTokenId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Payment Token (USDC)</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={launchPaymentToken}
                    onChange={(e) => setLaunchPaymentToken(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Treasury Address</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={launchTreasury}
                    onChange={(e) => setLaunchTreasury(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-white/50 mb-2 block">Phase Durations (seconds)</label>
                <div className="grid grid-cols-4 gap-2">
                  {launchPhaseDurations.map((d, i) => (
                    <div key={i}>
                      <span className="text-xs text-white/40">Phase {i}</span>
                      <input
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                        value={d}
                        onChange={(e) => {
                          const next = [...launchPhaseDurations];
                          next[i] = e.target.value;
                          setLaunchPhaseDurations(next);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mt-4">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Floor Price (USDC)</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={launchFloorPrice}
                    onChange={(e) => setLaunchFloorPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Min Increment (%)</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={launchMinIncrement}
                    onChange={(e) => setLaunchMinIncrement(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Participation Fee (USDC)</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={launchParticipationFee}
                    onChange={(e) => setLaunchParticipationFee(e.target.value)}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 mt-4 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={launchEnforceIncrement}
                  onChange={(e) => setLaunchEnforceIncrement(e.target.checked)}
                />
                Enforce minimum bid increment
              </label>

              <button
                onClick={handleLaunchAuction}
                disabled={!isFactoryOwner || isLoading}
                className="mt-6 w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
              >
                Create Auction
              </button>
              {!isFactoryOwner && <p className="mt-2 text-xs text-red-400">Only factory owner can create auctions</p>}
            </div>
          </div>
        )}

        {/* ============ MANAGE AUCTION TAB ============ */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            {/* Auction Selector */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="text-lg font-semibold mb-4">Select Auction</h2>
              <select
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                value={selectedAuction || contracts.AuctionManager}
                onChange={(e) => setSelectedAuction(e.target.value)}
              >
                <option value={contracts.AuctionManager}>
                  Default: {shorten(contracts.AuctionManager)}
                </option>
                {auctionsList.map((a) => (
                  <option key={a} value={a}>{shorten(a)}</option>
                ))}
              </select>
            </div>

            {/* Auction State */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-4">Auction State</h3>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="flex justify-between">
                  <span className="text-white/50">Owner</span>
                  <span className={isAuctionOwner ? "text-emerald-400" : ""}>{shorten(auctionOwner)}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-white/50 text-sm">Phase</span>
                  <div className="mt-1">
                    {auctionPhase !== null ? (
                      <PhaseProgressBar phase={auctionPhase} variant="expanded" />
                    ) : (
                      <span className="text-cyan-400 font-bold">-</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Leader</span>
                  <span>{shorten(auctionLeader)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">High Bid</span>
                  <span className="text-cyan-400">{formatUsdcDisplay(auctionHighBid)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Floor Price</span>
                  <span className="text-emerald-400">{formatUsdcDisplay(auctionFloorPrice)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Participation Fee</span>
                  <span className="text-yellow-400">{formatUsdcDisplay(auctionParticipationFee)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Min Increment</span>
                  <span className="text-purple-400">{auctionMinIncrement ? `${auctionMinIncrement}%` : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Time Remaining</span>
                  <span>{formatTime(auctionTimeRemaining)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Bidders</span>
                  <span>{auctionBidderCount ?? "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Finalized</span>
                  <span className={auctionFinalized ? "text-emerald-400" : "text-white/70"}>
                    {auctionFinalized === null ? "-" : auctionFinalized ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Paused</span>
                  <span className={auctionPaused ? "text-red-400" : "text-white/70"}>
                    {auctionPaused === null ? "-" : auctionPaused ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Winner</span>
                  <span className="text-emerald-400">{shorten(auctionWinner)}</span>
                </div>
              </div>
            </div>

            {/* Phase Actions */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-4">Phase Control</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => handleAuctionAction("Advance Phase", "advancePhase")}
                  disabled={!isAuctionOwner || isLoading}
                  className="rounded-lg bg-cyan-500 px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
                >
                  Advance Phase
                </button>
                <button
                  onClick={() => handleAuctionAction("Finalize Auction", "finalizeAuction")}
                  disabled={!isAuctionOwner || isLoading}
                  className="rounded-lg bg-emerald-500 px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
                >
                  Finalize Auction
                </button>
              </div>
            </div>

            {/* Financial Actions */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-4">Financial</h3>
              <button
                onClick={() => handleAuctionAction("Withdraw Proceeds", "withdrawProceeds")}
                disabled={!isAuctionOwner || isLoading}
                className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
              >
                Withdraw Proceeds
              </button>
            </div>

            {/* Emergency Actions */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
              <h3 className="font-semibold mb-4 text-red-400">Emergency Actions</h3>
              <div className="grid gap-3 md:grid-cols-2 mb-4">
                <button
                  onClick={() => handleAuctionAction("Pause", "pause")}
                  disabled={!isAuctionOwner || isLoading}
                  className="rounded-lg border border-red-500 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 disabled:opacity-50"
                >
                  Pause Auction
                </button>
                <button
                  onClick={() => handleAuctionAction("Unpause", "unpause")}
                  disabled={!isAuctionOwner || isLoading}
                  className="rounded-lg border border-emerald-500 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 disabled:opacity-50"
                >
                  Unpause Auction
                </button>
              </div>

              <div className="flex gap-3">
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  placeholder="Address to receive NFT"
                  value={emergencyWithdrawTo}
                  onChange={(e) => setEmergencyWithdrawTo(e.target.value)}
                />
                <button
                  onClick={() => handleAuctionAction("Emergency Withdraw NFT", "emergencyWithdrawNFT", [emergencyWithdrawTo])}
                  disabled={!isAuctionOwner || isLoading || !isAddress(emergencyWithdrawTo)}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Emergency Withdraw NFT
                </button>
              </div>
            </div>

            {!isAuctionOwner && hasSession && (
              <p className="text-center text-sm text-red-400">You are not the owner of this auction</p>
            )}
          </div>
        )}
      </div>

      {/* Toasts */}
      <div className="fixed right-4 top-20 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-3 text-sm shadow-lg ${
              t.type === "error"
                ? "bg-red-500/90 text-white"
                : t.type === "success"
                ? "bg-emerald-500/90 text-white"
                : "bg-white/10 text-white backdrop-blur"
            }`}
          >
            <div className="font-medium">{t.title}</div>
            {t.detail && <div className="text-xs opacity-80 mt-1">{t.detail}</div>}
          </div>
        ))}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl bg-white/10 px-6 py-4 text-sm">Processing transaction...</div>
        </div>
      )}
    </div>
  );
}
