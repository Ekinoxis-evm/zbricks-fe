"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import Header from "../components/Header";

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
    contracts: {
      HouseNFT: string;
      AuctionFactory: string;
      AuctionManager: string;
    };
    usdc: string;
  }
> = {
  8453: {
    chainId: 8453,
    chainName: "Base Mainnet",
    explorer: "https://base.blockscout.com",
    contracts: {
      HouseNFT: "0x44b659c474d1bcb0e6325ae17c882994d772e471",
      AuctionFactory: "0x1d5854ef9b5fd15e1f477a7d15c94ea0e795d9a5",
      AuctionManager: "0x24220aeb9360aaf896c99060c53332258736e30d",
    },
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  84532: {
    chainId: 84532,
    chainName: "Base Sepolia",
    explorer: "https://base-sepolia.blockscout.com",
    contracts: {
      HouseNFT: "0x3911826c047726de1881f5518faa06e06413aba6",
      AuctionFactory: "0xd13e24354d6e9706b4bc89272e31374ec71a2e75",
      AuctionManager: "0x4aee0c5afe353fb9fa111e0b5221db715b53cb10",
    },
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  5042002: {
    chainId: 5042002,
    chainName: "Arc Testnet",
    explorer: "https://testnet.arcscan.app",
    contracts: {
      HouseNFT: "0x6bb77d0b235d4d27f75ae0e3a4f465bf8ac91c0b",
      AuctionFactory: "0x88cc60b8a6161758b176563c78abeb7495d664d1",
      AuctionManager: "0x2fbaed3a30a53bd61676d9c5f46db5a73f710f53",
    },
    usdc: "0x3600000000000000000000000000000000000000",
  },
};

// ============ ABIs ============

const HOUSE_NFT_ABI = [
  "function admin() view returns (address)",
  "function nextTokenId() view returns (uint256)",
  "function tokenPhase(uint256) view returns (uint8)",
  "function tokenController(uint256) view returns (address)",
  "function ownerOf(uint256) view returns (address)",
  "function tokenURI(uint256) view returns (string)",
  "function getPhaseURI(uint256,uint8) view returns (string)",
  "function mintTo(address) returns (uint256)",
  "function setController(uint256,address)",
  "function setPhaseURIs(uint256,string[4])",
  "function updatePhaseURI(uint256,uint8,string)",
  "function advancePhase(uint256)",
  "function transferAdmin(address)",
  "function safeTransferFrom(address,address,uint256)",
];

const FACTORY_ABI = [
  "function owner() view returns (address)",
  "function getAuctions() view returns (address[])",
  "function getAuctionCount() view returns (uint256)",
  "function createAuction(address,address,address,uint256,uint256[4],uint256,uint256,bool,uint256,address) returns (address)",
];

const AUCTION_ABI = [
  "function owner() view returns (address)",
  "function paymentToken() view returns (address)",
  "function nftContract() view returns (address)",
  "function tokenId() view returns (uint256)",
  "function floorPrice() view returns (uint256)",
  "function currentPhase() view returns (uint8)",
  "function currentLeader() view returns (address)",
  "function currentHighBid() view returns (uint256)",
  "function winner() view returns (address)",
  "function finalized() view returns (bool)",
  "function paused() view returns (bool)",
  "function userBids(address) view returns (uint256)",
  "function getTimeRemaining() view returns (uint256)",
  "function getBidderCount() view returns (uint256)",
  "function advancePhase()",
  "function finalizeAuction()",
  "function withdrawProceeds()",
  "function emergencyWithdrawNFT(address)",
  "function pause()",
  "function unpause()",
];

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256)",
];

// ============ TYPES ============

type Tab = "nft" | "launch" | "manage";

type Toast = {
  id: string;
  type: "info" | "success" | "error";
  title: string;
  detail?: string;
};

type CircleWallet = {
  id: string;
  address: string;
  blockchain: string;
};

// ============ HELPERS ============

const shorten = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "-");
const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;

const getSessionValue = (key: string) => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
};

// ============ COMPONENT ============

export default function AdminPage() {
  const [selectedChainId, setSelectedChainId] = useState<number>(84532);
  const [activeTab, setActiveTab] = useState<Tab>("nft");

  const chainConfig = CHAIN_DEPLOYMENTS[selectedChainId];
  const rpcUrl = useMemo(() => {
    const envKey = {
      84532: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
      8453: process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL,
      5042002: process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL,
    }[selectedChainId];
    return envKey ?? DEFAULT_RPC_BY_CHAIN[selectedChainId];
  }, [selectedChainId]);

  const rpcProvider = useMemo(
    () => (rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : null),
    [rpcUrl]
  );

  // SDK & Session
  const sdkRef = useRef<W3SSdk | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBlockchain, setWalletBlockchain] = useState("");

  // UI
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
  const [auctionWinner, setAuctionWinner] = useState("");
  const [auctionFinalized, setAuctionFinalized] = useState<boolean | null>(null);
  const [auctionPaused, setAuctionPaused] = useState<boolean | null>(null);
  const [auctionTimeRemaining, setAuctionTimeRemaining] = useState<bigint | null>(null);
  const [auctionBidderCount, setAuctionBidderCount] = useState<number | null>(null);
  const [emergencyWithdrawTo, setEmergencyWithdrawTo] = useState("");

  const hasSession = Boolean(userToken && encryptionKey);
  const isNftAdmin = hasSession && nftAdmin && walletAddress.toLowerCase() === nftAdmin.toLowerCase();
  const isFactoryOwner = hasSession && factoryOwner && walletAddress.toLowerCase() === factoryOwner.toLowerCase();
  const isAuctionOwner = hasSession && auctionOwner && walletAddress.toLowerCase() === auctionOwner.toLowerCase();

  // ============ TOAST ============

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  // ============ SESSION ============

  const restoreSession = useCallback(() => {
    setUserToken(getSessionValue("w3s_user_token"));
    setEncryptionKey(getSessionValue("w3s_encryption_key"));
    setWalletId(getSessionValue("w3s_wallet_id"));
    setWalletAddress(getSessionValue("w3s_wallet_address") ?? "");
    setWalletBlockchain(getSessionValue("w3s_wallet_blockchain") ?? "");
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const initSdk = () => {
      try {
        const sdk = new W3SSdk({ appSettings: { appId } }, () => {});
        sdkRef.current = sdk;
        setSdkReady(true);
      } catch {
        pushToast({ type: "error", title: "SDK init failed" });
      }
    };
    initSdk();
  }, [pushToast]);

  // ============ EXECUTE CHALLENGE ============

  const executeChallenge = useCallback(
    async (challengeId: string) => {
      const sdk = sdkRef.current;
      if (!sdk || !sdkReady || !userToken || !encryptionKey) {
        throw new Error("Session not ready");
      }
      sdk.setAuthentication({ userToken, encryptionKey });
      return new Promise<{ transactionHash?: string }>((resolve, reject) => {
        sdk.execute(challengeId, (error, result) => {
          if (error) reject(error);
          else resolve(result as { transactionHash?: string });
        });
      });
    },
    [encryptionKey, sdkReady, userToken]
  );

  // ============ CONTRACT TX ============

  const runContractTx = useCallback(
    async (label: string, contractAddress: string, abi: string[], method: string, args: unknown[] = []) => {
      if (!userToken || !walletId || !walletAddress) {
        pushToast({ type: "error", title: "Connect wallet first" });
        return null;
      }

      setIsLoading(true);
      try {
        const iface = new ethers.Interface(abi);
        const callData = iface.encodeFunctionData(method, args);

        const response = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createContractExecutionChallenge",
            userToken,
            walletId,
            contractAddress,
            callData,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Failed to create challenge");

        const challengeId = data?.challengeId;
        if (!challengeId) throw new Error("Invalid challenge");

        pushToast({ type: "info", title: `${label} pending...` });
        const result = await executeChallenge(challengeId);
        pushToast({ type: "success", title: `${label} confirmed` });
        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Transaction failed";
        pushToast({ type: "error", title: label, detail: msg });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [executeChallenge, pushToast, userToken, walletAddress, walletId]
  );

  // ============ REFRESH DATA ============

  const refreshData = useCallback(async () => {
    if (!rpcProvider) return;

    try {
      // NFT Data
      const nft = new ethers.Contract(chainConfig.contracts.HouseNFT, HOUSE_NFT_ABI, rpcProvider);
      const [admin, nextId] = await Promise.all([nft.admin(), nft.nextTokenId()]);
      setNftAdmin(admin);
      setNftNextTokenId(nextId);

      const tokenId = BigInt(nftTokenId || "1");
      try {
        const [phase, controller, owner, uri] = await Promise.all([
          nft.tokenPhase(tokenId),
          nft.tokenController(tokenId),
          nft.ownerOf(tokenId),
          nft.tokenURI(tokenId),
        ]);
        setNftTokenPhase(Number(phase));
        setNftTokenController(controller);
        setNftTokenOwner(owner);
        setNftTokenUri(uri);
      } catch {
        setNftTokenPhase(null);
        setNftTokenController("");
        setNftTokenOwner("");
        setNftTokenUri("");
      }

      // Factory Data
      const factory = new ethers.Contract(chainConfig.contracts.AuctionFactory, FACTORY_ABI, rpcProvider);
      const [fOwner, auctions] = await Promise.all([factory.owner(), factory.getAuctions()]);
      setFactoryOwner(fOwner);
      setAuctionsList(auctions);

      // Set defaults
      if (!launchNftContract) setLaunchNftContract(chainConfig.contracts.HouseNFT);
      if (!launchPaymentToken) setLaunchPaymentToken(chainConfig.usdc);
      if (!launchTreasury && walletAddress) setLaunchTreasury(walletAddress);

      // Auction Data
      const auctionAddr = selectedAuction || chainConfig.contracts.AuctionManager;
      if (auctionAddr) {
        const auction = new ethers.Contract(auctionAddr, AUCTION_ABI, rpcProvider);
        const [owner, phase, leader, highBid, winner, finalized, paused] = await Promise.all([
          auction.owner(),
          auction.currentPhase(),
          auction.currentLeader(),
          auction.currentHighBid(),
          auction.winner(),
          auction.finalized(),
          auction.paused(),
        ]);
        setAuctionOwner(owner);
        setAuctionPhase(Number(phase));
        setAuctionLeader(leader);
        setAuctionHighBid(highBid);
        setAuctionWinner(winner);
        setAuctionFinalized(finalized);
        setAuctionPaused(paused);

        try {
          const [timeRem, bidderCount] = await Promise.all([
            auction.getTimeRemaining(),
            auction.getBidderCount(),
          ]);
          setAuctionTimeRemaining(timeRem);
          setAuctionBidderCount(Number(bidderCount));
        } catch {
          setAuctionTimeRemaining(null);
          setAuctionBidderCount(null);
        }
      }
    } catch (error) {
      pushToast({ type: "error", title: "Failed to load data" });
    }
  }, [rpcProvider, chainConfig, nftTokenId, selectedAuction, launchNftContract, launchPaymentToken, launchTreasury, walletAddress, pushToast]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // ============ NFT ACTIONS ============

  const handleMint = async () => {
    if (!ethers.isAddress(mintRecipient)) {
      pushToast({ type: "error", title: "Invalid recipient" });
      return;
    }
    await runContractTx("Mint NFT", chainConfig.contracts.HouseNFT, HOUSE_NFT_ABI, "mintTo", [mintRecipient]);
    refreshData();
  };

  const handleSetController = async () => {
    if (!ethers.isAddress(setControllerAddr)) {
      pushToast({ type: "error", title: "Invalid controller address" });
      return;
    }
    await runContractTx("Set Controller", chainConfig.contracts.HouseNFT, HOUSE_NFT_ABI, "setController", [
      BigInt(nftTokenId),
      setControllerAddr,
    ]);
    refreshData();
  };

  const handleSetPhaseUris = async () => {
    if (phaseUris.some((u) => !u.trim())) {
      pushToast({ type: "error", title: "Fill all 4 URIs" });
      return;
    }
    await runContractTx("Set Phase URIs", chainConfig.contracts.HouseNFT, HOUSE_NFT_ABI, "setPhaseURIs", [
      BigInt(nftTokenId),
      phaseUris,
    ]);
    refreshData();
  };

  const handleUpdateSingleUri = async () => {
    if (!singlePhaseUri.trim()) {
      pushToast({ type: "error", title: "URI required" });
      return;
    }
    await runContractTx("Update Phase URI", chainConfig.contracts.HouseNFT, HOUSE_NFT_ABI, "updatePhaseURI", [
      BigInt(nftTokenId),
      Number(singlePhaseIdx),
      singlePhaseUri,
    ]);
    refreshData();
  };

  const handleAdvanceNftPhase = async () => {
    await runContractTx("Advance NFT Phase", chainConfig.contracts.HouseNFT, HOUSE_NFT_ABI, "advancePhase", [
      BigInt(nftTokenId),
    ]);
    refreshData();
  };

  const handleTransferNftToFactory = async () => {
    if (!walletAddress) return;
    await runContractTx("Transfer NFT to Factory", chainConfig.contracts.HouseNFT, HOUSE_NFT_ABI, "safeTransferFrom", [
      walletAddress,
      chainConfig.contracts.AuctionFactory,
      BigInt(nftTokenId),
    ]);
    refreshData();
  };

  const handleTransferAdmin = async () => {
    if (!ethers.isAddress(transferAdminAddr)) {
      pushToast({ type: "error", title: "Invalid admin address" });
      return;
    }
    await runContractTx("Transfer Admin", chainConfig.contracts.HouseNFT, HOUSE_NFT_ABI, "transferAdmin", [
      transferAdminAddr,
    ]);
    refreshData();
  };

  // ============ LAUNCH AUCTION ============

  const handleLaunchAuction = async () => {
    if (!ethers.isAddress(launchNftContract) || !ethers.isAddress(launchPaymentToken) || !ethers.isAddress(launchTreasury)) {
      pushToast({ type: "error", title: "Invalid addresses" });
      return;
    }

    const durations = launchPhaseDurations.map((d) => BigInt(d || "0"));
    const floorPrice = ethers.parseUnits(launchFloorPrice || "0", 6);
    const participationFee = ethers.parseUnits(launchParticipationFee || "0", 6);

    await runContractTx("Create Auction", chainConfig.contracts.AuctionFactory, FACTORY_ABI, "createAuction", [
      walletAddress, // admin
      launchPaymentToken,
      launchNftContract,
      BigInt(launchTokenId),
      durations,
      floorPrice,
      BigInt(launchMinIncrement),
      launchEnforceIncrement,
      participationFee,
      launchTreasury,
    ]);
    refreshData();
  };

  // ============ MANAGE AUCTION ============

  const handleAuctionAction = async (label: string, method: string, args: unknown[] = []) => {
    const addr = selectedAuction || chainConfig.contracts.AuctionManager;
    await runContractTx(label, addr, AUCTION_ABI, method, args);
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

  const formatUsdc = (amount: bigint | null) => {
    if (amount === null) return "-";
    return ethers.formatUnits(amount, 6);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Header />

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-white/50">Manage NFTs, Launch & Control Auctions</p>
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
              onClick={refreshData}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Session Status */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <div className={`rounded-full px-3 py-1 ${hasSession ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
            {hasSession ? `Connected: ${shorten(walletAddress)}` : "Not connected"}
          </div>
          {!hasSession && (
            <button onClick={restoreSession} className="rounded-full border border-white/20 px-3 py-1 text-white/60 hover:bg-white/5">
              Load Session
            </button>
          )}
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
                  <span className="font-mono">{shorten(chainConfig.contracts.HouseNFT)}</span>
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
                  <input
                    key={i}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    placeholder={`Phase ${i} URI (ipfs://...)`}
                    value={uri}
                    onChange={(e) => {
                      const next = [...phaseUris];
                      next[i] = e.target.value;
                      setPhaseUris(next);
                    }}
                  />
                ))}
              </div>
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
                  <span className="font-mono">{shorten(chainConfig.contracts.AuctionFactory)}</span>
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
              Use the "Transfer NFT to Factory" button in the Manage NFT tab.
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
                value={selectedAuction || chainConfig.contracts.AuctionManager}
                onChange={(e) => setSelectedAuction(e.target.value)}
              >
                <option value={chainConfig.contracts.AuctionManager}>
                  Default: {shorten(chainConfig.contracts.AuctionManager)}
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
                <div className="flex justify-between">
                  <span className="text-white/50">Phase</span>
                  <span className="text-cyan-400 font-bold">{auctionPhase ?? "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Leader</span>
                  <span>{shorten(auctionLeader)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">High Bid</span>
                  <span className="text-cyan-400">{formatUsdc(auctionHighBid)} USDC</span>
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
                  disabled={!isAuctionOwner || isLoading || !ethers.isAddress(emergencyWithdrawTo)}
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
