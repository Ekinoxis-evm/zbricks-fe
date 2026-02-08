"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

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
    timestamp: string;
    contracts: {
      HouseNFT?: string;
      AuctionFactory?: string;
      AuctionManager?: string;
    };
  }
> = {
  8453: {
    chainId: 8453,
    chainName: "Base Mainnet",
    explorer: "https://base.blockscout.com",
    timestamp: "2026-02-08T04:15:46.408Z",
    contracts: {
      HouseNFT: "0x335845ef4f622145d963c9f39d6ff1b60757fee4",
      AuctionFactory: "0x57cdf2cdeae3f54e598e8def3583a251fec0eaf7",
      AuctionManager: "0xe6afb32fdd1c03edd3dc2f1b0037c3d4580d6dca",
    },
  },
  84532: {
    chainId: 84532,
    chainName: "Base Sepolia",
    explorer: "https://base-sepolia.blockscout.com",
    timestamp: "2026-02-08T04:15:46.408Z",
    contracts: {
      HouseNFT: "0xe23157f7d8ad43bfcf7aaff64257fd0fa17177d6",
      AuctionFactory: "0xd3390e5fec170d7577c850f5687a6542b66a4bbd",
      AuctionManager: "0x3347f6a853e04281daa0314f49a76964f010366f",
    },
  },
  5042002: {
    chainId: 5042002,
    chainName: "Arc Testnet",
    explorer: "https://testnet.arcscan.app",
    timestamp: "2026-02-08T04:15:46.403Z",
    contracts: {
      HouseNFT: "0x335845ef4f622145d963c9f39d6ff1b60757fee4",
      AuctionFactory: "0x57cdf2cdeae3f54e598e8def3583a251fec0eaf7",
      AuctionManager: "0xe6afb32fdd1c03edd3dc2f1b0037c3d4580d6dca",
    },
  },
};

const FACTORY_ABI = [
  "function owner() view returns (address)",
  "function getAuctions() view returns (address[])",
  "function getAuctionCount() view returns (uint256)",
  "function getAuction(uint256) view returns (address)",
  "function isAuction(address) view returns (bool)",
  "function createAuction(address paymentToken,address nftContract,uint256 tokenId,uint256[4] phaseDurations,uint256 floorPrice,uint256 minBidIncrementPercent,bool enforceMinIncrement) returns (address)",
  "event AuctionCreated(address indexed auctionAddress,address indexed nftContract,uint256 tokenId,address paymentToken)",
];

const AUCTION_ABI = [
  "function paymentToken() view returns (address)",
  "function nftContract() view returns (address)",
  "function tokenId() view returns (uint256)",
  "function floorPrice() view returns (uint256)",
  "function minBidIncrementPercent() view returns (uint256)",
  "function enforceMinIncrement() view returns (bool)",
  "function currentPhase() view returns (uint8)",
  "function currentLeader() view returns (address)",
  "function currentHighBid() view returns (uint256)",
  "function winner() view returns (address)",
  "function finalized() view returns (bool)",
  "function paused() view returns (bool)",
  "function userBids(address) view returns (uint256)",
  "function phases(uint8) view returns (uint256 minDuration,uint256 startTime,address leader,uint256 highBid,bool revealed)",
  "function placeBid(uint256 incrementalAmount)",
  "function withdrawBid()",
  "function advancePhase()",
  "function finalizeAuction()",
  "function withdrawProceeds()",
  "function emergencyWithdrawNFT(address)",
  "function pause()",
  "function unpause()",
  "function getBidders() view returns (address[])",
  "function getBidderCount() view returns (uint256)",
  "function getCurrentPhaseInfo() view returns (tuple(uint256 minDuration,uint256 startTime,address leader,uint256 highBid,bool revealed))",
  "function getTimeRemaining() view returns (uint256)",
  "function getCurrentLeaderAndBid() view returns (address leader,uint256 highBid)",
  "function getPhaseInfo(uint8) view returns (tuple(uint256 minDuration,uint256 startTime,address leader,uint256 highBid,bool revealed))",
  "function getAuctionState() view returns (tuple(uint8 phase,bool biddingOpen,bool finalized,bool paused,address leader,uint256 highBid))",
  "function owner() view returns (address)",
];

const HOUSE_ABI = [
  "function admin() view returns (address)",
  "function tokenPhase(uint256) view returns (uint8)",
  "function tokenController(uint256) view returns (address)",
  "function nextTokenId() view returns (uint256)",
  "function mintTo(address) returns (uint256)",
  "function setPhaseURIs(uint256,string[4])",
  "function updatePhaseURI(uint256,uint8,string)",
  "function setController(uint256,address)",
  "function advancePhase(uint256)",
  "function tokenURI(uint256) view returns (string)",
  "function getPhaseURI(uint256,uint8) view returns (string)",
  "function transferAdmin(address)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256) view returns (address)",
  "function balanceOf(address) view returns (uint256)",
];

const ERC721_ABI = [
  "function approve(address,uint256)",
  "function setApprovalForAll(address,bool)",
  "function safeTransferFrom(address,address,uint256)",
];

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256)",
];

type Toast = {
  id: string;
  type: "info" | "success" | "error";
  title: string;
  detail?: string;
  txHash?: string;
};

type CircleWallet = {
  id: string;
  address: string;
  blockchain: string;
};

type LoginResult = {
  userToken: string;
  encryptionKey: string;
};

type LoginError = {
  code?: number;
  message?: string;
};

type ChallengeExecuteResult = {
  transactionHash?: string;
  txHash?: string;
};

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;

const shorten = (addr: string) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—");

const formatUnitsSafe = (value: bigint | null, decimals: number) => {
  if (value === null) return "—";
  try {
    return ethers.formatUnits(value, decimals);
  } catch {
    return value.toString();
  }
};

const formatSeconds = (value: bigint | null) => {
  if (value === null) return "—";
  const total = Number(value);
  if (!Number.isFinite(total)) return "—";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
};

const safeParseUnits = (value: string, decimals: number) => {
  if (!value.trim()) return null;
  try {
    return ethers.parseUnits(value, decimals);
  } catch {
    return null;
  }
};

const safeParseUint = (value: string) => {
  if (!value.trim()) return null;
  try {
    const parsed = BigInt(value);
    if (parsed < 0n) return null;
    return parsed;
  } catch {
    return null;
  }
};

const jsonStringify = (value: unknown) =>
  JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v), 2);

const getSessionValue = (key: string) => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
};

export default function ContractsPage() {
  const envFactoryAddress = process.env.NEXT_PUBLIC_AUCTION_FACTORY_ADDRESS ?? "";
  const [selectedChainId, setSelectedChainId] = useState<number>(84532);

  const chainConfig = CHAIN_DEPLOYMENTS[selectedChainId];
  const explorerBase = chainConfig?.explorer ?? "https://base-sepolia.blockscout.com";
  const rpcUrl = useMemo(() => {
    if (selectedChainId === 84532) {
      return process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? DEFAULT_RPC_BY_CHAIN[84532];
    }
    if (selectedChainId === 8453) {
      return process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL ?? DEFAULT_RPC_BY_CHAIN[8453];
    }
    if (selectedChainId === 5042002) {
      return (
        process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL ?? DEFAULT_RPC_BY_CHAIN[5042002]
      );
    }
    return DEFAULT_RPC_BY_CHAIN[84532];
  }, [selectedChainId]);

  const rpcProvider = useMemo(
    () => (rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : null),
    [rpcUrl],
  );

  const sdkRef = useRef<W3SSdk | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const [userToken, setUserToken] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState("");
  const [loginError, setLoginError] = useState(false);

  const [wallets, setWallets] = useState<CircleWallet[]>([]);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBlockchain, setWalletBlockchain] = useState("");

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [factoryInput, setFactoryInput] = useState("");
  const [factoryOwner, setFactoryOwner] = useState("");
  const [auctions, setAuctions] = useState<string[]>([]);
  const [selectedAuction, setSelectedAuction] = useState("");
  const [manualAuction, setManualAuction] = useState("");

  const [createPaymentToken, setCreatePaymentToken] = useState("");
  const [createNftContract, setCreateNftContract] = useState("");
  const [createTokenId, setCreateTokenId] = useState("");
  const [createPhaseDurations, setCreatePhaseDurations] = useState(["", "", "", ""]);
  const [createFloorPrice, setCreateFloorPrice] = useState("");
  const [createMinIncrementPercent, setCreateMinIncrementPercent] = useState("");
  const [createEnforceMinIncrement, setCreateEnforceMinIncrement] = useState(true);
  const [createTokenDecimals, setCreateTokenDecimals] = useState<number | null>(null);

  const [auctionOwner, setAuctionOwner] = useState("");
  const [auctionPaymentToken, setAuctionPaymentToken] = useState("");
  const [auctionNftContract, setAuctionNftContract] = useState("");
  const [auctionTokenId, setAuctionTokenId] = useState<bigint | null>(null);
  const [auctionFloorPrice, setAuctionFloorPrice] = useState<bigint | null>(null);
  const [minIncrementPercent, setMinIncrementPercent] = useState<bigint | null>(null);
  const [enforceMinIncrement, setEnforceMinIncrement] = useState<boolean | null>(null);
  const [currentPhase, setCurrentPhase] = useState<number | null>(null);
  const [currentLeader, setCurrentLeader] = useState("");
  const [currentHighBid, setCurrentHighBid] = useState<bigint | null>(null);
  const [winner, setWinner] = useState("");
  const [finalized, setFinalized] = useState<boolean | null>(null);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [biddingOpen, setBiddingOpen] = useState<boolean | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<bigint | null>(null);
  const [userBidTotal, setUserBidTotal] = useState<bigint | null>(null);
  const [bidderCount, setBidderCount] = useState<number | null>(null);
  const [bidders, setBidders] = useState<string[]>([]);
  const [showBidders, setShowBidders] = useState(false);

  const [phaseQuery, setPhaseQuery] = useState("0");
  const [phaseInfo, setPhaseInfo] = useState("{}");
  const [currentPhaseInfo, setCurrentPhaseInfo] = useState("{}");

  const [paymentTokenSymbol, setPaymentTokenSymbol] = useState("TOKEN");
  const [paymentTokenDecimals, setPaymentTokenDecimals] = useState(6);
  const [paymentTokenBalance, setPaymentTokenBalance] = useState<bigint | null>(null);
  const [paymentTokenAllowance, setPaymentTokenAllowance] = useState<bigint | null>(null);

  const [approveAmount, setApproveAmount] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [refundQuery, setRefundQuery] = useState("");
  const [refundBalance, setRefundBalance] = useState<bigint | null>(null);

  const [houseName, setHouseName] = useState("");
  const [houseSymbol, setHouseSymbol] = useState("");
  const [houseAdmin, setHouseAdmin] = useState("");
  const [houseTokenPhase, setHouseTokenPhase] = useState<number | null>(null);
  const [houseTokenController, setHouseTokenController] = useState("");
  const [houseOwnerOf, setHouseOwnerOf] = useState("");
  const [houseTokenUri, setHouseTokenUri] = useState("");
  const [housePhaseQuery, setHousePhaseQuery] = useState("0");
  const [housePhaseUri, setHousePhaseUri] = useState("");
  const [houseNextTokenId, setHouseNextTokenId] = useState<bigint | null>(null);
  const [mintRecipient, setMintRecipient] = useState("");
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [setControllerAddress, setSetControllerAddress] = useState("");
  const [emergencyWithdrawTo, setEmergencyWithdrawTo] = useState("");
  const [updatePhaseIndex, setUpdatePhaseIndex] = useState("0");
  const [updatePhaseUri, setUpdatePhaseUri] = useState("");
  const [setPhaseUris, setSetPhaseUris] = useState(["", "", "", ""]);
  const [transferHouseAdmin, setTransferHouseAdmin] = useState("");

  const defaultFactoryAddress = chainConfig?.contracts?.AuctionFactory ?? "";
  const defaultAuctionAddress = chainConfig?.contracts?.AuctionManager ?? "";
  const defaultHouseAddress = chainConfig?.contracts?.HouseNFT ?? "";

  const factoryAddress = useMemo(() => {
    if (ethers.isAddress(envFactoryAddress)) return envFactoryAddress;
    if (ethers.isAddress(factoryInput)) return factoryInput;
    if (ethers.isAddress(defaultFactoryAddress)) return defaultFactoryAddress;
    return "";
  }, [defaultFactoryAddress, envFactoryAddress, factoryInput]);

  const auctionAddress = useMemo(() => {
    if (ethers.isAddress(manualAuction)) return manualAuction;
    if (ethers.isAddress(selectedAuction)) return selectedAuction;
    return "";
  }, [manualAuction, selectedAuction]);

  const hasSession = Boolean(userToken && encryptionKey);
  const isWalletOnBase = useMemo(() => {
    const chain = walletBlockchain.toUpperCase();
    if (selectedChainId === 84532) {
      return chain.includes("BASE") && chain.includes("SEPOLIA");
    }
    if (selectedChainId === 8453) {
      return chain.includes("BASE") && !chain.includes("SEPOLIA");
    }
    if (selectedChainId === 5042002) {
      return chain.includes("ARC");
    }
    return false;
  }, [selectedChainId, walletBlockchain]);
  const isFactoryOwner =
    hasSession && factoryOwner && walletAddress && walletAddress.toLowerCase() === factoryOwner.toLowerCase();
  const isAuctionOwner =
    hasSession && auctionOwner && walletAddress && walletAddress.toLowerCase() === auctionOwner.toLowerCase();

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const next = { ...toast, id };
    setToasts((prev) => [...prev, next]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6500);
  }, []);

  const persistSession = useCallback((token: string, key: string) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("w3s_user_token", token);
    window.sessionStorage.setItem("w3s_encryption_key", key);
  }, []);

  const persistWallet = useCallback((wallet: CircleWallet) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("w3s_wallet_id", wallet.id);
    window.localStorage.setItem("w3s_wallet_address", wallet.address);
    window.localStorage.setItem("w3s_wallet_blockchain", wallet.blockchain);
  }, []);

  const restoreSession = useCallback(() => {
    const token = getSessionValue("w3s_user_token");
    const key = getSessionValue("w3s_encryption_key");
    setUserToken(token);
    setEncryptionKey(key);
    if (!token || !key) {
      setLoginStatus("Inicia sesión en /auth o /wallets para continuar.");
      setLoginError(false);
    }
  }, []);

  const loadWallets = useCallback(async (token: string) => {
    const response = await fetch("/api/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "listWallets",
        userToken: token,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || data?.message || "No se pudo cargar wallets.");
    }

    const list = (data.wallets as CircleWallet[]) || [];
    setWallets(list);
    const primary =
      list.find(
        (wallet) =>
          wallet.blockchain?.toUpperCase().includes("BASE") &&
          wallet.blockchain?.toUpperCase().includes("SEPOLIA"),
      ) ?? list[0] ?? null;

    if (primary) {
      setWalletId(primary.id);
      setWalletAddress(primary.address);
      setWalletBlockchain(primary.blockchain ?? "");
      persistWallet(primary);
    } else {
      setWalletId(null);
      setWalletAddress("");
      setWalletBlockchain("");
    }
  }, [persistWallet]);

  const executeChallenge = useCallback(
    async (challengeId: string) => {
      const sdk = sdkRef.current;
      if (!sdk || !sdkReady) {
        throw new Error("SDK no está listo");
      }
      if (!userToken || !encryptionKey) {
        throw new Error("Sesión inválida. Vuelve a iniciar sesión.");
      }

      sdk.setAuthentication({
        userToken,
        encryptionKey,
      });

      return await new Promise<ChallengeExecuteResult | undefined>((resolve, reject) => {
        sdk.execute(challengeId, (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result as ChallengeExecuteResult | undefined);
        });
      });
    },
    [encryptionKey, sdkReady, userToken],
  );

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (!rpcProvider) {
        pushToast({
          type: "error",
          title: "RPC no configurado",
          detail: `Agrega el RPC para ${chainConfig?.chainName ?? "esta red"}.`,
        });
        return;
      }
      if (factoryAddress) {
        const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, rpcProvider);
        const owner: string = await factory.owner();
        setFactoryOwner(owner);

        let list: string[] = [];
        try {
          list = (await factory.getAuctions()) as string[];
        } catch {
          const count = await factory.getAuctionCount();
          const total = Number(count);
          const entries: string[] = [];
          for (let i = 0; i < total; i += 1) {
            const addr = (await factory.getAuction(i)) as string;
            entries.push(addr);
          }
          list = entries;
        }

        setAuctions(list);
        if (!manualAuction && list.length > 0 && !list.includes(selectedAuction)) {
          setSelectedAuction(list[0]);
        }
      }

      if (auctionAddress) {
        const auction = new ethers.Contract(auctionAddress, AUCTION_ABI, rpcProvider);
    const [
      owner,
      paymentToken,
      nftContract,
      tokenId,
      floorPrice,
      minBidIncrementPercent,
      enforceMin,
      phase,
      leader,
      highBid,
      win,
      isFinalized,
      isPaused,
    ] = await Promise.all([
      auction.owner(),
      auction.paymentToken(),
      auction.nftContract(),
      auction.tokenId(),
      auction.floorPrice(),
      auction.minBidIncrementPercent(),
      auction.enforceMinIncrement(),
      auction.currentPhase(),
      auction.currentLeader(),
      auction.currentHighBid(),
      auction.winner(),
      auction.finalized(),
      auction.paused(),
    ]);

    let timeRemainingValue: bigint | null = null;
    try {
      timeRemainingValue = await auction.getTimeRemaining();
    } catch {
      timeRemainingValue = null;
    }

    let phaseInfoValue: unknown = null;
    try {
      phaseInfoValue = await auction.getCurrentPhaseInfo();
    } catch {
      phaseInfoValue = null;
    }

        setAuctionOwner(owner);
        setAuctionPaymentToken(paymentToken);
        setAuctionNftContract(nftContract);
        setAuctionTokenId(tokenId);
        setAuctionFloorPrice(floorPrice);
        setMinIncrementPercent(minBidIncrementPercent);
        setEnforceMinIncrement(Boolean(enforceMin));
        setCurrentPhase(Number(phase));
        setCurrentLeader(leader);
        setCurrentHighBid(highBid);
        setWinner(win);
        setFinalized(Boolean(isFinalized));
        setPaused(Boolean(isPaused));
    setTimeRemaining(timeRemainingValue);
    const computedBidding = !isFinalized && !isPaused && Number(phase) <= 2;
    setBiddingOpen(computedBidding);
    setCurrentPhaseInfo(phaseInfoValue ? jsonStringify(phaseInfoValue) : "{}");

        if (walletAddress) {
          const bidTotal = await auction.userBids(walletAddress);
          setUserBidTotal(bidTotal);
        } else {
          setUserBidTotal(null);
        }

        try {
          const count = await auction.getBidderCount();
          setBidderCount(Number(count));
        } catch {
          setBidderCount(null);
        }

        if (showBidders) {
          try {
            const list = (await auction.getBidders()) as string[];
            setBidders(list);
          } catch {
            setBidders([]);
          }
        }

        const phaseIndex = Number(phaseQuery);
        if (Number.isFinite(phaseIndex) && phaseIndex >= 0) {
          try {
            const info = await auction.getPhaseInfo(phaseIndex);
            setPhaseInfo(jsonStringify(info));
          } catch {
            setPhaseInfo("{}");
          }
        }

        if (walletAddress) {
          try {
            const refundAddress = ethers.isAddress(refundQuery) ? refundQuery : walletAddress;
            const refund = await auction.userBids(refundAddress);
            setRefundBalance(refund);
          } catch {
            setRefundBalance(null);
          }
        } else {
          setRefundBalance(null);
        }

        if (ethers.isAddress(paymentToken)) {
          const token = new ethers.Contract(paymentToken, ERC20_ABI, rpcProvider);
          try {
            const [symbol, decimals] = await Promise.all([token.symbol(), token.decimals()]);
            setPaymentTokenSymbol(symbol);
            setPaymentTokenDecimals(Number(decimals));
          } catch {
            setPaymentTokenSymbol("TOKEN");
            setPaymentTokenDecimals(6);
          }

          if (walletAddress) {
            try {
              const [balance, allowance] = await Promise.all([
                token.balanceOf(walletAddress),
                token.allowance(walletAddress, auctionAddress),
              ]);
              setPaymentTokenBalance(balance);
              setPaymentTokenAllowance(allowance);
            } catch {
              setPaymentTokenBalance(null);
              setPaymentTokenAllowance(null);
            }
          } else {
            setPaymentTokenBalance(null);
            setPaymentTokenAllowance(null);
          }
        } else {
          setPaymentTokenSymbol("TOKEN");
          setPaymentTokenDecimals(6);
          setPaymentTokenBalance(null);
          setPaymentTokenAllowance(null);
        }

        if (ethers.isAddress(nftContract)) {
          const resolvedTokenId = tokenId as bigint;
          const house = new ethers.Contract(
            nftContract,
            [...HOUSE_ABI, ...ERC721_ABI],
            rpcProvider,
          );
          try {
            const results = await Promise.allSettled([
              house.name(),
              house.symbol(),
              house.admin(),
              house.tokenPhase(resolvedTokenId),
              house.tokenController(resolvedTokenId),
              house.ownerOf(resolvedTokenId),
              house.tokenURI(resolvedTokenId),
              house.nextTokenId?.(),
            ]);
            const [name, symbol, admin, tokenPhase, tokenController, ownerOf, tokenURI, nextId] =
              results.map((item) => (item.status === "fulfilled" ? item.value : null));

            setHouseName((name as string) ?? "");
            setHouseSymbol((symbol as string) ?? "");
            setHouseAdmin((admin as string) ?? "");
            setHouseTokenPhase(tokenPhase !== null ? Number(tokenPhase as bigint) : null);
            setHouseTokenController((tokenController as string) ?? "");
            setHouseOwnerOf((ownerOf as string) ?? "");
            setHouseTokenUri((tokenURI as string) ?? "");
            setHouseNextTokenId(nextId !== null ? (nextId as bigint) : null);
          } catch {
            setHouseName("");
            setHouseSymbol("");
            setHouseAdmin("");
            setHouseTokenPhase(null);
            setHouseTokenController("");
            setHouseOwnerOf("");
            setHouseTokenUri("");
            setHouseNextTokenId(null);
          }

          const phaseIndex = Number(housePhaseQuery);
          if (Number.isFinite(phaseIndex) && phaseIndex >= 0) {
            try {
              const uri = await house.getPhaseURI(resolvedTokenId, phaseIndex);
              setHousePhaseUri(uri as string);
            } catch {
              setHousePhaseUri("");
            }
          }
        } else {
          setHouseName("");
          setHouseSymbol("");
          setHouseAdmin("");
          setHouseTokenPhase(null);
          setHouseTokenController("");
          setHouseOwnerOf("");
          setHouseTokenUri("");
          setHouseNextTokenId(null);
          setHousePhaseUri("");
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo refrescar el estado.";
      pushToast({ type: "error", title: "Error al refrescar", detail: message });
    } finally {
      setIsRefreshing(false);
    }
  }, [
    auctionAddress,
    chainConfig,
    factoryAddress,
    manualAuction,
    phaseQuery,
    pushToast,
    refundQuery,
    rpcProvider,
    selectedAuction,
    showBidders,
    housePhaseQuery,
    walletAddress,
  ]);

  const runContractTx = useCallback(
    async (
      label: string,
      contractAddress: string,
      abi: string[],
      method: string,
      args: unknown[] = [],
    ) => {
      if (!userToken || !walletId) {
        pushToast({ type: "error", title: "Conecta tu sesión" });
        return null;
      }
      if (!walletAddress) {
        pushToast({ type: "error", title: "Wallet no disponible" });
        return null;
      }
      if (!isWalletOnBase) {
        pushToast({
          type: "error",
          title: "Wallet en red incorrecta",
          detail: `Tu wallet está en ${walletBlockchain || "otra red"}. Debe ser ${chainConfig?.chainName ?? "esta red"}.`,
        });
        return null;
      }

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
        if (!response.ok) {
          throw new Error(data?.error || data?.message || "No se pudo crear challenge.");
        }

        const challengeId = data?.challengeId as string | undefined;
        if (!challengeId) {
          throw new Error("Challenge inválido.");
        }

        pushToast({ type: "info", title: `${label} enviado` });
        const exec = await executeChallenge(challengeId);
        const hash = exec?.transactionHash || exec?.txHash;
        if (hash) {
          setLastTxHash(hash);
          pushToast({ type: "success", title: `${label} confirmado`, txHash: hash });
        } else {
          pushToast({ type: "success", title: `${label} confirmado` });
        }
        await refreshAll();
        return exec;
      } catch (error) {
        const message =
          (error as { shortMessage?: string; reason?: string; message?: string })
            .shortMessage ||
          (error as { reason?: string }).reason ||
          (error as { message?: string }).message ||
          "No se pudo enviar la transacción.";
        pushToast({ type: "error", title: label, detail: message });
        return null;
      }
    },
    [
      executeChallenge,
      isWalletOnBase,
      chainConfig,
      pushToast,
      refreshAll,
      userToken,
      walletAddress,
      walletBlockchain,
      walletId,
    ],
  );

  const handleCreateAuction = async () => {
    if (!factoryAddress) {
      pushToast({ type: "error", title: "Factory address inválida" });
      return;
    }

    if (!ethers.isAddress(createPaymentToken)) {
      pushToast({ type: "error", title: "Payment token inválido" });
      return;
    }
    if (!ethers.isAddress(createNftContract)) {
      pushToast({ type: "error", title: "NFT contract inválido" });
      return;
    }

    const tokenId = safeParseUint(createTokenId);
    if (tokenId === null) {
      pushToast({ type: "error", title: "TokenId inválido" });
      return;
    }

    const durations = createPhaseDurations.map((value) => safeParseUint(value));
    if (durations.some((value) => value === null)) {
      pushToast({ type: "error", title: "Duraciones inválidas" });
      return;
    }

    const decimals = createTokenDecimals ?? 6;
    const floorPrice = safeParseUnits(createFloorPrice, decimals);
    if (floorPrice === null) {
      pushToast({ type: "error", title: "Floor price inválido" });
      return;
    }

    const minIncrement = safeParseUint(createMinIncrementPercent);
    if (minIncrement === null) {
      pushToast({ type: "error", title: "Min increment inválido" });
      return;
    }

    await runContractTx("Create auction", factoryAddress, FACTORY_ABI, "createAuction", [
      createPaymentToken,
      createNftContract,
      tokenId,
      durations as [bigint, bigint, bigint, bigint],
      floorPrice,
      minIncrement,
      createEnforceMinIncrement,
    ]);
  };

  const handleApprove = async () => {
    if (!auctionAddress || !auctionPaymentToken) {
      pushToast({ type: "error", title: "Selecciona una auction" });
      return;
    }

    const amount = safeParseUnits(approveAmount, paymentTokenDecimals);
    if (amount === null) {
      pushToast({ type: "error", title: "Monto inválido" });
      return;
    }

    await runContractTx("Approve", auctionPaymentToken, ERC20_ABI, "approve", [
      auctionAddress,
      amount,
    ]);
  };

  const handlePlaceBid = async () => {
    if (!auctionAddress) {
      pushToast({ type: "error", title: "Selecciona una auction" });
      return;
    }

    const amount = safeParseUnits(bidAmount, paymentTokenDecimals);
    if (amount === null) {
      pushToast({ type: "error", title: "Monto inválido" });
      return;
    }

    await runContractTx("Place bid", auctionAddress, AUCTION_ABI, "placeBid", [amount]);
  };

  const handleWithdrawBid = async () => {
    if (!auctionAddress) {
      pushToast({ type: "error", title: "Selecciona una auction" });
      return;
    }

    await runContractTx("Withdraw bid", auctionAddress, AUCTION_ABI, "withdrawBid");
  };

  const handleAuctionAdminAction = async (label: string, method: string) => {
    if (!auctionAddress) {
      pushToast({ type: "error", title: "Selecciona una auction" });
      return;
    }

    if (!isAuctionOwner) {
      pushToast({ type: "error", title: "No eres owner" });
      return;
    }

    if (method === "emergencyWithdrawNFT") {
      if (!ethers.isAddress(emergencyWithdrawTo)) {
        pushToast({ type: "error", title: "Dirección inválida" });
        return;
      }
      await runContractTx(label, auctionAddress, AUCTION_ABI, method, [emergencyWithdrawTo]);
      return;
    }

    await runContractTx(label, auctionAddress, AUCTION_ABI, method);
  };

  const handleMintTo = async () => {
    if (!auctionNftContract || !ethers.isAddress(auctionNftContract)) {
      pushToast({ type: "error", title: "NFT contract inválido" });
      return;
    }
    if (!ethers.isAddress(mintRecipient)) {
      pushToast({ type: "error", title: "Recipient inválido" });
      return;
    }

    const result = await runContractTx("Mint", auctionNftContract, HOUSE_ABI, "mintTo", [
      mintRecipient,
    ]);
    if (result) {
      setMintedTokenId("Mint enviado");
    }
  };

  const handleSetController = async () => {
    if (!auctionNftContract || auctionTokenId === null) {
      pushToast({ type: "error", title: "Token no disponible" });
      return;
    }
    if (!ethers.isAddress(setControllerAddress)) {
      pushToast({ type: "error", title: "Controller inválido" });
      return;
    }

    await runContractTx("Set controller", auctionNftContract, HOUSE_ABI, "setController", [
      auctionTokenId,
      setControllerAddress,
    ]);
  };

  const handleAdvancePhase = async () => {
    if (!auctionNftContract || auctionTokenId === null) {
      pushToast({ type: "error", title: "Token no disponible" });
      return;
    }
    await runContractTx("Advance phase", auctionNftContract, HOUSE_ABI, "advancePhase", [
      auctionTokenId,
    ]);
  };

  const handleUpdatePhaseUri = async () => {
    if (!auctionNftContract || auctionTokenId === null) {
      pushToast({ type: "error", title: "Token no disponible" });
      return;
    }
    const phase = safeParseUint(updatePhaseIndex);
    if (phase === null) {
      pushToast({ type: "error", title: "Phase inválida" });
      return;
    }
    if (!updatePhaseUri.trim()) {
      pushToast({ type: "error", title: "URI inválida" });
      return;
    }

    await runContractTx("Update phase URI", auctionNftContract, HOUSE_ABI, "updatePhaseURI", [
      auctionTokenId,
      phase,
      updatePhaseUri.trim(),
    ]);
  };

  const handleSetPhaseUris = async () => {
    if (!auctionNftContract || auctionTokenId === null) {
      pushToast({ type: "error", title: "Token no disponible" });
      return;
    }
    if (setPhaseUris.some((uri) => !uri.trim())) {
      pushToast({ type: "error", title: "Completa las 4 URIs" });
      return;
    }

    await runContractTx("Set phase URIs", auctionNftContract, HOUSE_ABI, "setPhaseURIs", [
      auctionTokenId,
      setPhaseUris.map((uri) => uri.trim()) as [string, string, string, string],
    ]);
  };

  const handleTransferHouseAdmin = async () => {
    if (!auctionNftContract || auctionTokenId === null) {
      pushToast({ type: "error", title: "Token no disponible" });
      return;
    }
    if (!ethers.isAddress(transferHouseAdmin)) {
      pushToast({ type: "error", title: "Admin inválido" });
      return;
    }

    await runContractTx("Transfer admin", auctionNftContract, HOUSE_ABI, "transferAdmin", [
      transferHouseAdmin,
    ]);
  };

  useEffect(() => {
    const initSdk = () => {
      try {
        const sdk = new W3SSdk(
          {
            appSettings: { appId },
          },
          (error?: LoginError | null, result?: LoginResult | null) => {
            if (error || !result) {
              setLoginError(true);
              setLoginStatus(error?.message || "Authentication failed.");
              return;
            }

            setLoginError(false);
            setLoginStatus("Login verified. Loading wallets...");
            setUserToken(result.userToken);
            setEncryptionKey(result.encryptionKey);
            persistSession(result.userToken, result.encryptionKey);
            void loadWallets(result.userToken);
          },
        );

        sdkRef.current = sdk;
        setSdkReady(true);
      } catch (error) {
        setLoginError(true);
        setLoginStatus("Failed to initialize Web SDK");
      }
    };

    initSdk();
  }, [loadWallets, persistSession]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (userToken) {
      void loadWallets(userToken).catch(() => null);
    }
  }, [userToken, loadWallets]);

  useEffect(() => {
    if (!ethers.isAddress(envFactoryAddress) && ethers.isAddress(defaultFactoryAddress)) {
      setFactoryInput(defaultFactoryAddress);
    }
  }, [defaultFactoryAddress, envFactoryAddress]);

  useEffect(() => {
    if (!rpcProvider || !ethers.isAddress(createPaymentToken)) {
      setCreateTokenDecimals(null);
      return;
    }

    const token = new ethers.Contract(createPaymentToken, ERC20_ABI, rpcProvider);
    token
      .decimals()
      .then((value: number) => setCreateTokenDecimals(Number(value)))
      .catch(() => setCreateTokenDecimals(null));
  }, [createPaymentToken, rpcProvider]);

  useEffect(() => {
    if (!rpcProvider) return;
    refreshAll();
    const interval = setInterval(refreshAll, 12000);
    return () => clearInterval(interval);
  }, [refreshAll, rpcProvider]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Contracts Dashboard</h1>
            <p className="text-sm text-white/60">AuctionFactory · AuctionManager · HouseNFT</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-white/80"
              value={selectedChainId}
              onChange={(event) => setSelectedChainId(Number(event.target.value))}
            >
              {Object.values(CHAIN_DEPLOYMENTS).map((chain) => (
                <option key={chain.chainId} value={chain.chainId}>
                  {chain.chainName} ({chain.chainId})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={restoreSession}
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80"
            >
              Cargar sesión
            </button>
            <button
              type="button"
              onClick={refreshAll}
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80"
            >
              {isRefreshing ? "Refrescando..." : "Refrescar"}
            </button>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="rounded-full border border-white/10 px-3 py-1 text-white/70">
            Wallet: {walletAddress ? shorten(walletAddress) : "No conectada"}
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-white/70">
            Wallets: {wallets.length}
          </div>
          {!rpcUrl && (
            <div className="rounded-full border border-rose-400/40 px-3 py-1 text-rose-200">
              RPC faltante para esta red
            </div>
          )}
          <div
            className={`rounded-full border px-3 py-1 text-white/70 ${
              isWalletOnBase ? "border-emerald-400/40 text-emerald-200" : "border-rose-400/40 text-rose-200"
            }`}
          >
            Chain: {chainConfig?.chainName ?? "—"} · Wallet: {walletBlockchain || "—"}
          </div>
          {lastTxHash && (
            <a
              className="text-cyan-200 underline"
              href={`${explorerBase}/tx/${lastTxHash}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver última tx
            </a>
          )}
        </div>

        {!hasSession && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Necesitas iniciar sesión con Circle en /auth o /wallets para continuar.
            {loginStatus && (
              <div className={`mt-2 text-xs ${loginError ? "text-rose-200" : "text-white/60"}`}>
                {loginStatus}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Deployment reference</div>
              <div className="text-xs text-white/50">
                Chain: {chainConfig?.chainName ?? "—"} · {chainConfig?.chainId ?? "—"}
              </div>
            </div>
            {chainConfig?.explorer && (
              <a
                className="text-xs text-cyan-200 underline"
                href={chainConfig.explorer}
                target="_blank"
                rel="noreferrer"
              >
                Explorer
              </a>
            )}
          </div>
          <div className="mt-3 grid gap-2 text-xs text-white/60 md:grid-cols-3">
            <div>
              <div className="text-white/80">AuctionFactory</div>
              <div>{defaultFactoryAddress || "—"}</div>
            </div>
            <div>
              <div className="text-white/80">AuctionManager</div>
              <div>{defaultAuctionAddress || "—"}</div>
            </div>
            <div>
              <div className="text-white/80">HouseNFT</div>
              <div>{defaultHouseAddress || "—"}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Factory</h2>
                <p className="text-sm text-white/60">Gestiona auctions desde AuctionFactory.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-white/60">Factory address</label>
                {ethers.isAddress(envFactoryAddress) ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
                    {envFactoryAddress}
                  </div>
                ) : (
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                    placeholder="0x..."
                    value={factoryInput}
                    onChange={(event) => setFactoryInput(event.target.value)}
                  />
                )}
                <p className="text-xs text-white/50">Owner: {factoryOwner || "—"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60">Auctions</label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                  value={selectedAuction}
                  onChange={(event) => setSelectedAuction(event.target.value)}
                  disabled={!auctions.length}
                >
                  {auctions.length === 0 && <option value="">Sin auctions</option>}
                  {auctions.map((auction) => (
                    <option key={auction} value={auction}>
                      {auction}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                  placeholder="O pega una address manual"
                  value={manualAuction}
                  onChange={(event) => setManualAuction(event.target.value)}
                />
                {auctionAddress && (
                  <a
                    className="text-xs text-cyan-200 underline"
                    href={`${explorerBase}/address/${auctionAddress}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver auction en explorer
                  </a>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">
              Para crear una auction, el NFT (tokenId) debe estar transferido al Factory
              antes de llamar createAuction (el factory transfiere el NFT al nuevo
              AuctionManager).
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-xs text-white/60">Payment token</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                  value={createPaymentToken}
                  onChange={(event) => setCreatePaymentToken(event.target.value)}
                  placeholder="0x..."
                />
                <label className="text-xs text-white/60">NFT contract</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                  value={createNftContract}
                  onChange={(event) => setCreateNftContract(event.target.value)}
                  placeholder="0x..."
                />
                <label className="text-xs text-white/60">Token ID</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                  value={createTokenId}
                  onChange={(event) => setCreateTokenId(event.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {createPhaseDurations.map((value, index) => (
                    <div key={`phase-${index}`}>
                      <label className="text-xs text-white/60">Phase {index} (s)</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                        value={value}
                        onChange={(event) => {
                          const next = [...createPhaseDurations];
                          next[index] = event.target.value;
                          setCreatePhaseDurations(next);
                        }}
                        placeholder="3600"
                      />
                    </div>
                  ))}
                </div>
                <label className="text-xs text-white/60">Floor price</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                  value={createFloorPrice}
                  onChange={(event) => setCreateFloorPrice(event.target.value)}
                  placeholder="1000"
                />
                <label className="text-xs text-white/60">Min bid increment (%)</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                  value={createMinIncrementPercent}
                  onChange={(event) => setCreateMinIncrementPercent(event.target.value)}
                  placeholder="5"
                />
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={createEnforceMinIncrement}
                    onChange={(event) => setCreateEnforceMinIncrement(event.target.checked)}
                  />
                  Enforce min increment
                </label>
                <button
                  type="button"
                  disabled={!isFactoryOwner}
                  onClick={handleCreateAuction}
                  className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                >
                  Crear auction
                </button>
                {!isFactoryOwner && (
                  <p className="text-xs text-rose-200">Solo el owner puede crear auctions.</p>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Auction seleccionada</h2>
              <p className="text-sm text-white/60">Estado principal del AuctionManager.</p>
              <div className="mt-4 grid gap-2 text-sm text-white/70">
                <div>Owner: {auctionOwner || "—"}</div>
                <div>Payment token: {auctionPaymentToken || "—"}</div>
                <div>NFT contract: {auctionNftContract || "—"}</div>
                <div>Token ID: {auctionTokenId !== null ? auctionTokenId.toString() : "—"}</div>
                <div>
                  Floor price: {formatUnitsSafe(auctionFloorPrice, paymentTokenDecimals)} {paymentTokenSymbol}
                </div>
                <div>Min increment: {minIncrementPercent?.toString() ?? "—"}%</div>
                <div>Enforce min: {enforceMinIncrement === null ? "—" : enforceMinIncrement ? "Sí" : "No"}</div>
                <div>Phase: {currentPhase ?? "—"}</div>
                <div>Leader: {currentLeader || "—"}</div>
                <div>
                  High bid: {formatUnitsSafe(currentHighBid, paymentTokenDecimals)} {paymentTokenSymbol}
                </div>
                <div>Winner: {winner || "—"}</div>
                <div>Finalized: {finalized === null ? "—" : finalized ? "Sí" : "No"}</div>
                <div>Paused: {paused === null ? "—" : paused ? "Sí" : "No"}</div>
                <div>Bidding open: {biddingOpen === null ? "—" : biddingOpen ? "Sí" : "No"}</div>
                <div>Time remaining: {formatSeconds(timeRemaining)}</div>
                <div>
                  Tu bid total: {formatUnitsSafe(userBidTotal, paymentTokenDecimals)} {paymentTokenSymbol}
                </div>
                <div>Bidder count: {bidderCount ?? "—"}</div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={showBidders}
                    onChange={(event) => setShowBidders(event.target.checked)}
                  />
                  Mostrar bidders
                </label>
                {showBidders && (
                  <div className="mt-3 max-h-32 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                    {bidders.length === 0 ? "Sin bidders" : bidders.map((bidder) => <div key={bidder}>{bidder}</div>)}
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-2">
                <label className="text-xs text-white/60">Phase info (0..3)</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={phaseQuery}
                  onChange={(event) => setPhaseQuery(event.target.value)}
                />
                <pre className="max-h-40 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
                  {phaseInfo}
                </pre>
              </div>

              <div className="mt-4">
                <label className="text-xs text-white/60">Current phase info</label>
                <pre className="max-h-40 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
                  {currentPhaseInfo}
                </pre>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Payment token</h2>
              <p className="text-sm text-white/60">Balance, allowance y approve.</p>
              <div className="mt-4 grid gap-2 text-sm text-white/70">
                <div>Symbol: {paymentTokenSymbol}</div>
                <div>Decimals: {paymentTokenDecimals}</div>
                <div>
                  Balance: {formatUnitsSafe(paymentTokenBalance, paymentTokenDecimals)} {paymentTokenSymbol}
                </div>
                <div>
                  Allowance: {formatUnitsSafe(paymentTokenAllowance, paymentTokenDecimals)} {paymentTokenSymbol}
                </div>
                {paymentTokenAllowance !== null && bidAmount && (
                  <div className="text-xs text-amber-200">
                    {paymentTokenAllowance < (safeParseUnits(bidAmount, paymentTokenDecimals) ?? 0n)
                      ? "Allowance menor que el bid. Necesitas approve."
                      : "Allowance suficiente."}
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-2">
                <label className="text-xs text-white/60">Approve amount</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={approveAmount}
                  onChange={(event) => setApproveAmount(event.target.value)}
                  placeholder="100"
                />
                <button
                  type="button"
                  onClick={handleApprove}
                  className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Approve
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Usuario</h2>
              <p className="text-sm text-white/60">Bid y withdraw.</p>
              <div className="mt-4 grid gap-2">
                <label className="text-xs text-white/60">Bid amount ({paymentTokenSymbol})</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={bidAmount}
                  onChange={(event) => setBidAmount(event.target.value)}
                  placeholder="25"
                />
                <button
                  type="button"
                  onClick={handlePlaceBid}
                  className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Place bid
                </button>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleWithdrawBid}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                >
                  Withdraw bid
                </button>
              </div>
              <div className="mt-4 text-xs text-white/60">
                Floor price: {formatUnitsSafe(auctionFloorPrice, paymentTokenDecimals)} {paymentTokenSymbol} ·
                Min increment: {minIncrementPercent?.toString() ?? "—"}% · Enforce: {enforceMinIncrement ? "Sí" : "No"}
              </div>
              <div className="mt-4 grid gap-2">
                <label className="text-xs text-white/60">Consultar bid de address</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={refundQuery}
                  onChange={(event) => setRefundQuery(event.target.value)}
                  placeholder="0x... (opcional)"
                />
                <div className="text-xs text-white/70">
                  Bid total: {formatUnitsSafe(refundBalance, paymentTokenDecimals)} {paymentTokenSymbol}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Admin AuctionManager</h2>
              <p className="text-sm text-white/60">Acciones solo owner.</p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => handleAuctionAdminAction("Advance phase", "advancePhase")}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                >
                  Advance phase
                </button>
                <button
                  type="button"
                  onClick={() => handleAuctionAdminAction("Finalize", "finalizeAuction")}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                >
                  Finalize auction
                </button>
                <button
                  type="button"
                  onClick={() => handleAuctionAdminAction("Withdraw proceeds", "withdrawProceeds")}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                >
                  Withdraw proceeds
                </button>
                <div className="grid gap-2">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={emergencyWithdrawTo}
                    onChange={(event) => setEmergencyWithdrawTo(event.target.value)}
                    placeholder="Dirección para emergency withdraw"
                  />
                  <button
                    type="button"
                    onClick={() => handleAuctionAdminAction("Emergency withdraw NFT", "emergencyWithdrawNFT")}
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                  >
                    Emergency withdraw NFT
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleAuctionAdminAction("Pause", "pause")}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={() => handleAuctionAdminAction("Unpause", "unpause")}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                >
                  Unpause
                </button>
                {!isAuctionOwner && (
                  <p className="text-xs text-rose-200">No eres owner de la auction.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">HouseNFT</h2>
            <p className="text-sm text-white/60">Gestión multi-token.</p>

            <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
              <div>Name: {houseName || "—"}</div>
              <div>Symbol: {houseSymbol || "—"}</div>
              <div>Admin: {houseAdmin || "—"}</div>
              <div>Token phase: {houseTokenPhase ?? "—"}</div>
              <div>Token controller: {houseTokenController || "—"}</div>
              <div>OwnerOf: {houseOwnerOf || "—"}</div>
              <div>Token URI: {houseTokenUri || "—"}</div>
              <div>Next tokenId: {houseNextTokenId?.toString() ?? "—"}</div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-white/60">Get phase URI (0..3)</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={housePhaseQuery}
                  onChange={(event) => setHousePhaseQuery(event.target.value)}
                />
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
                  {housePhaseUri || "—"}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60">Mint to</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={mintRecipient}
                  onChange={(event) => setMintRecipient(event.target.value)}
                  placeholder="0x..."
                />
                <button
                  type="button"
                  onClick={handleMintTo}
                  className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Mint
                </button>
                {mintedTokenId && (
                  <div className="text-xs text-emerald-200">{mintedTokenId}</div>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-white/60">Set controller</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={setControllerAddress}
                  onChange={(event) => setSetControllerAddress(event.target.value)}
                  placeholder="0x..."
                />
                <button
                  type="button"
                  onClick={handleSetController}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                >
                  Set controller
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60">Advance phase</label>
                <button
                  type="button"
                  onClick={handleAdvancePhase}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                >
                  Advance phase
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-white/60">Update phase URI</label>
                <div className="flex gap-2">
                  <input
                    className="w-20 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={updatePhaseIndex}
                    onChange={(event) => setUpdatePhaseIndex(event.target.value)}
                    placeholder="0"
                  />
                  <input
                    className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={updatePhaseUri}
                    onChange={(event) => setUpdatePhaseUri(event.target.value)}
                    placeholder="ipfs://..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUpdatePhaseUri}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                >
                  Update phase URI
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60">Set 4 phase URIs</label>
                {setPhaseUris.map((value, index) => (
                  <input
                    key={`phase-uri-${index}`}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    value={value}
                    onChange={(event) => {
                      const next = [...setPhaseUris];
                      next[index] = event.target.value;
                      setSetPhaseUris(next);
                    }}
                    placeholder={`URI fase ${index}`}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleSetPhaseUris}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                >
                  Set phase URIs
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-2">
              <label className="text-xs text-white/60">Transfer admin</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                value={transferHouseAdmin}
                onChange={(event) => setTransferHouseAdmin(event.target.value)}
                placeholder="0x..."
              />
              <button
                type="button"
                onClick={handleTransferHouseAdmin}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm"
              >
                Transfer admin
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed right-6 top-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-72 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
              toast.type === "error"
                ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
                : toast.type === "success"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                  : "border-white/20 bg-black/60 text-white"
            }`}
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.detail && <div className="mt-1 text-xs text-white/70">{toast.detail}</div>}
            {toast.txHash && (
              <a
                className="mt-2 block text-xs text-cyan-200 underline"
                href={`${explorerBase}/tx/${toast.txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver tx
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
