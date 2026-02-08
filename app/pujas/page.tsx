"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import Header from "../components/Header";

// ============ TYPES ============

type SvgProps = { className?: string };

type Toast = {
  id: string;
  type: "info" | "success" | "error";
  title: string;
  detail?: string;
};

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
  "function placeBid(uint256)",
  "function withdrawBid()",
];

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256)",
];

// ============ ICONS ============

const IconShield = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M12 3 5 6v6c0 4.6 3 7.9 7 9 4-1.1 7-4.4 7-9V6l-7-3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="m9.5 12.2 1.8 1.8 3.4-3.8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconClock = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 7v5l3 2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTrending = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M4 16l6-6 4 4 6-7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 7h4v4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconGavel = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path d="M9.5 6.5 17 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="m12 4 4 4-2 2-4-4 2-2Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="m6 10 4 4-2 2-4-4 2-2Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M4 20h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconWallet = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M4 7h13a3 3 0 0 1 3 3v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M16 12h4v4h-4a2 2 0 0 1 0-4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M4 7V6a2 2 0 0 1 2-2h9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconArrowUpRight = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path d="M7 17 17 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M10 7h7v7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconWithdraw = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M12 19V5m0 0-5 5m5-5 5 5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============ HELPERS ============

const formatMoney = (n: number, currency = "USDC") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n).replace("$", "") + ` ${currency}`;

const formatUsdc = (amount: bigint | null) => {
  if (amount === null) return "-";
  return Number(ethers.formatUnits(amount, 6)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const shortAddr = (s: string) => (s && s.length > 12 ? `${s.slice(0, 6)}...${s.slice(-4)}` : s || "-");

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;

const getSessionValue = (key: string) => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
};

const formatTimeRemaining = (seconds: bigint | null) => {
  if (seconds === null) return "-";
  const s = Number(seconds);
  if (s <= 0) return "Phase complete";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

// ============ COMPONENT ============

export default function AuctionBidPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get auction address from URL query param or use default
  const auctionAddressParam = searchParams.get("auction");

  // UI Theme
  const ui = useMemo(
    () => ({
      bg: "bg-[#07090A]",
      card: "bg-white/[0.04] border border-white/[0.08] shadow-[0_18px_60px_rgba(0,0,0,0.55)]",
      cardInner: "bg-black/30 border border-white/[0.08]",
      pill: "bg-[#0B1516] border border-[#2DD4D4]/35 text-[#7DEAEA]",
      pillMuted: "bg-white/[0.03] border border-white/[0.08] text-white/70",
      teal: "#2DD4D4",
    }),
    []
  );

  // Chain selection
  const [selectedChainId, setSelectedChainId] = useState<number>(84532);
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

  // Auction State
  const [auctionPhase, setAuctionPhase] = useState<number | null>(null);
  const [auctionLeader, setAuctionLeader] = useState("");
  const [auctionHighBid, setAuctionHighBid] = useState<bigint | null>(null);
  const [auctionFloorPrice, setAuctionFloorPrice] = useState<bigint | null>(null);
  const [auctionWinner, setAuctionWinner] = useState("");
  const [auctionFinalized, setAuctionFinalized] = useState<boolean | null>(null);
  const [auctionPaused, setAuctionPaused] = useState<boolean | null>(null);
  const [auctionTimeRemaining, setAuctionTimeRemaining] = useState<bigint | null>(null);
  const [auctionBidderCount, setAuctionBidderCount] = useState<number | null>(null);

  // User State
  const [userBid, setUserBid] = useState<bigint | null>(null);
  const [userUsdcBalance, setUserUsdcBalance] = useState<bigint | null>(null);
  const [userUsdcAllowance, setUserUsdcAllowance] = useState<bigint | null>(null);

  // UI State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bidInput, setBidInput] = useState("");
  const [bidError, setBidError] = useState<string | null>(null);

  const hasSession = Boolean(userToken && encryptionKey && walletAddress);
  const isLeader = hasSession && auctionLeader && walletAddress.toLowerCase() === auctionLeader.toLowerCase();
  const isWinner = hasSession && auctionWinner && walletAddress.toLowerCase() === auctionWinner.toLowerCase();
  const canBid = hasSession && !auctionFinalized && !auctionPaused && auctionPhase !== null && auctionPhase <= 2;
  const canWithdraw = hasSession && userBid !== null && userBid > BigInt(0) && !isLeader && !isWinner;

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
        pushToast({ type: "success", title: `${label} confirmed!` });
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

  // Determine auction address (from URL param or default)
  const auctionAddress = useMemo((): string => {
    if (auctionAddressParam && ethers.isAddress(auctionAddressParam)) {
      return auctionAddressParam;
    }
    return chainConfig.contracts.AuctionManager;
  }, [auctionAddressParam, chainConfig.contracts.AuctionManager]);

  // ============ REFRESH DATA ============

  const refreshData = useCallback(async () => {
    if (!rpcProvider) return;

    try {
      const auction = new ethers.Contract(auctionAddress, AUCTION_ABI, rpcProvider);

      const [phase, leader, highBid, floorPrice, winner, finalized, paused, timeRemaining, bidderCount] = await Promise.all([
        auction.currentPhase(),
        auction.currentLeader(),
        auction.currentHighBid(),
        auction.floorPrice(),
        auction.winner(),
        auction.finalized(),
        auction.paused(),
        auction.getTimeRemaining().catch(() => BigInt(0)),
        auction.getBidderCount().catch(() => BigInt(0)),
      ]);

      setAuctionPhase(Number(phase));
      setAuctionLeader(leader);
      setAuctionHighBid(highBid);
      setAuctionFloorPrice(floorPrice);
      setAuctionWinner(winner);
      setAuctionFinalized(finalized);
      setAuctionPaused(paused);
      setAuctionTimeRemaining(timeRemaining);
      setAuctionBidderCount(Number(bidderCount));

      // User-specific data
      if (walletAddress) {
        const [userBidAmount] = await Promise.all([
          auction.userBids(walletAddress),
        ]);
        setUserBid(userBidAmount);

        // USDC balance and allowance
        const usdc = new ethers.Contract(chainConfig.usdc, ERC20_ABI, rpcProvider);
        const [balance, allowance] = await Promise.all([
          usdc.balanceOf(walletAddress),
          usdc.allowance(walletAddress, auctionAddress),
        ]);
        setUserUsdcBalance(balance);
        setUserUsdcAllowance(allowance);
      }
    } catch (error) {
      console.error("Failed to load auction data:", error);
    }
  }, [rpcProvider, chainConfig, walletAddress, auctionAddress]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [refreshData]);

  // ============ APPROVE USDC ============

  const handleApproveUsdc = async () => {
    const amount = parseFloat(bidInput);
    if (isNaN(amount) || amount <= 0) {
      pushToast({ type: "error", title: "Enter a valid amount first" });
      return;
    }

    // Approve a larger amount to avoid multiple approvals
    const approveAmount = ethers.parseUnits((amount * 2).toFixed(6), 6);

    await runContractTx(
      "Approve USDC",
      chainConfig.usdc,
      ERC20_ABI,
      "approve",
      [auctionAddress, approveAmount]
    );
    refreshData();
  };

  // ============ PLACE BID ============

  const handlePlaceBid = async () => {
    setBidError(null);

    if (!hasSession) {
      router.push("/auth");
      return;
    }

    const amount = parseFloat(bidInput);
    if (isNaN(amount) || amount <= 0) {
      setBidError("Enter a valid bid amount.");
      return;
    }

    const bidAmount = ethers.parseUnits(amount.toFixed(6), 6);

    // Check USDC balance
    if (userUsdcBalance !== null && bidAmount > userUsdcBalance) {
      setBidError(`Insufficient USDC balance. You have ${formatUsdc(userUsdcBalance)} USDC.`);
      return;
    }

    // Check allowance
    if (userUsdcAllowance !== null && bidAmount > userUsdcAllowance) {
      setBidError("Please approve USDC first.");
      return;
    }

    // Validate minimum bid
    const currentUserBid = userBid ?? BigInt(0);
    const newTotalBid = currentUserBid + bidAmount;

    if (auctionFloorPrice !== null && newTotalBid < auctionFloorPrice) {
      setBidError(`Your total bid must be at least ${formatUsdc(auctionFloorPrice)} USDC (floor price).`);
      return;
    }

    // Check if outbidding current leader
    if (auctionHighBid !== null && !isLeader && newTotalBid <= auctionHighBid) {
      const minRequired = auctionHighBid + (auctionHighBid * BigInt(5) / BigInt(100)); // 5% increment
      setBidError(`Your total bid must exceed ${formatUsdc(minRequired)} USDC to become the leader.`);
      return;
    }

    const result = await runContractTx(
      "Place Bid",
      auctionAddress,
      AUCTION_ABI,
      "placeBid",
      [bidAmount]
    );

    if (result) {
      setBidInput("");
      refreshData();
    }
  };

  // ============ WITHDRAW BID ============

  const handleWithdrawBid = async () => {
    if (!canWithdraw) {
      pushToast({ type: "error", title: "Cannot withdraw - you may be the leader" });
      return;
    }

    const result = await runContractTx(
      "Withdraw Bid",
      auctionAddress,
      AUCTION_ABI,
      "withdrawBid",
      []
    );

    if (result) {
      refreshData();
    }
  };

  // ============ COMPUTED VALUES ============

  const bidAmountParsed = parseFloat(bidInput) || 0;
  const bidAmountWei = ethers.parseUnits(bidAmountParsed.toFixed(6), 6);
  const needsApproval = userUsdcAllowance !== null && bidAmountWei > userUsdcAllowance;
  const newTotalBid = (userBid ?? BigInt(0)) + bidAmountWei;

  const phaseLabels = ["Phase 0: Initial", "Phase 1: Details", "Phase 2: Final", "Finalized"];
  const phaseLabel = auctionPhase !== null ? phaseLabels[Math.min(auctionPhase, 3)] : "-";

  return (
    <div className={`min-h-screen ${ui.bg} text-white`}>
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div className="min-w-0">
            <button
              onClick={() => router.push("/marketplace")}
              className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 mb-2"
            >
              <span>←</span> Back to Marketplace
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/75">
              <IconShield className="h-4 w-4 text-[#7DEAEA]" />
              Live Auction - On-Chain
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Property Auction
            </h1>
            <p className="mt-1 text-sm text-white/55">
              Bid with USDC on {chainConfig.chainName}
            </p>
          </div>

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
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Auction Info & Bidding */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auction Status */}
            <div className={`rounded-3xl ${ui.card} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Auction Status</h2>
                <button
                  onClick={refreshData}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  Refresh
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className={`rounded-2xl ${ui.cardInner} p-4`}>
                  <div className="text-xs text-white/50 mb-1">Current Phase</div>
                  <div className="text-lg font-semibold text-cyan-400">{phaseLabel}</div>
                </div>

                <div className={`rounded-2xl ${ui.cardInner} p-4`}>
                  <div className="text-xs text-white/50 mb-1">High Bid</div>
                  <div className="text-lg font-semibold text-emerald-400">
                    {formatUsdc(auctionHighBid)} USDC
                  </div>
                </div>

                <div className={`rounded-2xl ${ui.cardInner} p-4`}>
                  <div className="text-xs text-white/50 mb-1">Current Leader</div>
                  <div className="text-sm font-mono text-white/80">
                    {isLeader ? (
                      <span className="text-emerald-400">You!</span>
                    ) : (
                      shortAddr(auctionLeader)
                    )}
                  </div>
                </div>

                <div className={`rounded-2xl ${ui.cardInner} p-4`}>
                  <div className="text-xs text-white/50 mb-1">Time Remaining</div>
                  <div className="flex items-center gap-2">
                    <IconClock className="h-4 w-4 text-cyan-400" />
                    <span className="font-semibold">{formatTimeRemaining(auctionTimeRemaining)}</span>
                  </div>
                </div>

                <div className={`rounded-2xl ${ui.cardInner} p-4`}>
                  <div className="text-xs text-white/50 mb-1">Floor Price</div>
                  <div className="text-sm font-semibold">{formatUsdc(auctionFloorPrice)} USDC</div>
                </div>

                <div className={`rounded-2xl ${ui.cardInner} p-4`}>
                  <div className="text-xs text-white/50 mb-1">Total Bidders</div>
                  <div className="text-sm font-semibold">{auctionBidderCount ?? "-"}</div>
                </div>
              </div>

              {/* Status indicators */}
              <div className="flex flex-wrap gap-2 mt-4">
                {auctionFinalized && (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-3 py-1 text-xs">
                    Auction Finalized
                  </span>
                )}
                {auctionPaused && (
                  <span className="rounded-full bg-red-500/20 text-red-300 px-3 py-1 text-xs">
                    Auction Paused
                  </span>
                )}
                {auctionWinner && auctionWinner !== ethers.ZeroAddress && (
                  <span className="rounded-full bg-cyan-500/20 text-cyan-300 px-3 py-1 text-xs">
                    Winner: {shortAddr(auctionWinner)}
                  </span>
                )}
              </div>
            </div>

            {/* Place Bid Section */}
            <div className={`rounded-3xl ${ui.card} p-6`}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <IconGavel className="h-5 w-5 text-cyan-400" />
                Place Your Bid
              </h2>

              {!hasSession ? (
                <div className="text-center py-8">
                  <p className="text-white/60 mb-4">Connect your wallet to start bidding</p>
                  <button
                    onClick={() => router.push("/auth")}
                    className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-black hover:brightness-110"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : auctionFinalized ? (
                <div className="text-center py-8">
                  <p className="text-white/60">This auction has ended.</p>
                  {isWinner && (
                    <p className="text-emerald-400 mt-2 font-semibold">Congratulations! You won!</p>
                  )}
                </div>
              ) : auctionPaused ? (
                <div className="text-center py-8">
                  <p className="text-amber-400">Bidding is temporarily paused.</p>
                </div>
              ) : (
                <>
                  {/* Your current bid */}
                  {userBid !== null && userBid > BigInt(0) && (
                    <div className="mb-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-cyan-300">Your Current Bid</div>
                          <div className="text-xl font-bold text-cyan-400">{formatUsdc(userBid)} USDC</div>
                        </div>
                        {isLeader && (
                          <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-3 py-1 text-sm font-semibold">
                            You're Leading!
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bid input */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-white/50 mb-2 block">
                        Add to your bid (USDC)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter amount..."
                          value={bidInput}
                          onChange={(e) => {
                            setBidInput(e.target.value);
                            setBidError(null);
                          }}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-lg outline-none focus:border-cyan-500/60"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                          USDC
                        </div>
                      </div>
                    </div>

                    {bidAmountParsed > 0 && (
                      <div className="text-sm text-white/60">
                        New total bid: <span className="text-cyan-400 font-semibold">{formatUsdc(newTotalBid)} USDC</span>
                      </div>
                    )}

                    {bidError && (
                      <div className="text-sm text-red-400">{bidError}</div>
                    )}

                    {/* Balance info */}
                    <div className="flex flex-wrap gap-4 text-xs text-white/50">
                      <span>Balance: {formatUsdc(userUsdcBalance)} USDC</span>
                      <span>Allowance: {formatUsdc(userUsdcAllowance)} USDC</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {needsApproval && bidAmountParsed > 0 ? (
                        <button
                          onClick={handleApproveUsdc}
                          disabled={isLoading}
                          className="flex-1 group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
                        >
                          Approve USDC
                        </button>
                      ) : (
                        <button
                          onClick={handlePlaceBid}
                          disabled={isLoading || !bidAmountParsed}
                          className="flex-1 group inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
                        >
                          <IconGavel className="h-5 w-5" />
                          Place Bid
                          <IconArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </button>
                      )}

                      {canWithdraw && (
                        <button
                          onClick={handleWithdrawBid}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <IconWithdraw className="h-5 w-5" />
                          Withdraw Bid
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Wallet & Info */}
          <div className="space-y-6">
            {/* Wallet Card */}
            <div className={`rounded-3xl ${ui.card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <IconWallet className="h-4 w-4 text-cyan-400" />
                  My Wallet
                </div>
                <button
                  onClick={() => router.push(hasSession ? "/cuenta" : "/auth")}
                  className={`rounded-xl px-3 py-1.5 text-xs ${ui.pillMuted} hover:bg-white/[0.06]`}
                >
                  {hasSession ? "View" : "Connect"}
                </button>
              </div>

              {hasSession ? (
                <div className="space-y-3">
                  <div className={`rounded-2xl ${ui.cardInner} p-3`}>
                    <div className="text-[11px] text-white/50">Address</div>
                    <div className="text-sm font-mono text-white/85">{shortAddr(walletAddress)}</div>
                  </div>
                  <div className={`rounded-2xl ${ui.cardInner} p-3`}>
                    <div className="text-[11px] text-white/50">USDC Balance</div>
                    <div className="text-sm font-semibold text-white/85">
                      {formatUsdc(userUsdcBalance)} USDC
                    </div>
                  </div>
                  <div className={`rounded-2xl ${ui.cardInner} p-3`}>
                    <div className="text-[11px] text-white/50">Your Bid</div>
                    <div className="text-sm font-semibold text-cyan-400">
                      {userBid && userBid > BigInt(0) ? `${formatUsdc(userBid)} USDC` : "No bid yet"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/50">
                  Connect your wallet to participate in the auction.
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className={`rounded-3xl ${ui.card} p-5`}>
              <h3 className="text-sm font-semibold mb-3">How Bidding Works</h3>
              <ul className="space-y-2 text-xs text-white/60">
                <li className="flex gap-2">
                  <span className="text-cyan-400">1.</span>
                  <span>Bids are cumulative - each bid adds to your total</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400">2.</span>
                  <span>Only the winner pays; losers get full refunds</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400">3.</span>
                  <span>You can withdraw your bid anytime (unless leading)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400">4.</span>
                  <span>Auction progresses through 3 reveal phases</span>
                </li>
              </ul>
            </div>

            {/* Contract Info */}
            <div className={`rounded-3xl ${ui.card} p-5`}>
              <h3 className="text-sm font-semibold mb-3">Contract Info</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/50">Auction</span>
                  <a
                    href={`${chainConfig.explorer}/address/${auctionAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-cyan-400 hover:underline"
                  >
                    {shortAddr(auctionAddress)}
                  </a>
                </div>
                {auctionAddressParam && (
                  <div className="text-[10px] text-white/40 text-right">
                    Custom auction
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/50">USDC</span>
                  <a
                    href={`${chainConfig.explorer}/address/${chainConfig.usdc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-cyan-400 hover:underline"
                  >
                    {shortAddr(chainConfig.usdc)}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Network</span>
                  <span className="text-white/80">{chainConfig.chainName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          <div className="rounded-xl bg-white/10 px-6 py-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              Processing transaction...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
