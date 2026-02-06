"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ethers } from "ethers";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

const AUCTION_ADDRESS = "0xe6afb32fdd1c03edd3dc2f1b0037c3d4580d6dca";
const HOUSE_ADDRESS = "0x7ea51d8855ba98c6167f71d272813faba1244a0c";
const BASESCAN = "https://sepolia.basescan.org";
const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;

const AUCTION_ABI = [
  "function usdc() view returns (address)",
  "function houseNFT() view returns (address)",
  "function admin() view returns (address)",
  "function currentPhase() view returns (uint8)",
  "function currentLeader() view returns (address)",
  "function currentHighBid() view returns (uint256)",
  "function finalized() view returns (bool)",
  "function paused() view returns (bool)",
  "function getAuctionState() view returns (tuple(uint8 phase,bool biddingOpen,bool finalized,bool paused,address leader,uint256 highBid))",
  "function getTimeRemaining() view returns (uint256)",
  "function getCurrentLeaderAndBid() view returns (address leader,uint256 highBid)",
  "function getCurrentPhaseInfo() view returns (tuple(uint256 minDuration,uint256 startTime,address leader,uint256 highBid,bool revealed))",
  "function getPhaseInfo(uint8) view returns (tuple(uint256 minDuration,uint256 startTime,address leader,uint256 highBid,bool revealed))",
  "function getBidderRefund(address) view returns (uint256)",
  "function refundBalance(address) view returns (uint256)",
  "function phases(uint8) view returns (uint256 minDuration,uint256 startTime,address leader,uint256 highBid,bool revealed)",
  "function placeBid(uint256)",
  "function withdraw()",
  "function advancePhase()",
  "function finalizeAuction()",
  "function withdrawProceeds()",
  "function transferAdmin(address)",
  "function pause()",
  "function unpause()",
];

const HOUSE_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function admin() view returns (address)",
  "function currentPhase() view returns (uint8)",
  "function controller() view returns (address)",
  "function tokenURI(uint256) view returns (string)",
  "function getPhaseURI(uint8) view returns (string)",
  "function ownerOf(uint256) view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function transferAdmin(address)",
  "function setController(address)",
  "function advancePhase(uint8)",
  "function updatePhaseURI(uint8,string)",
];

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256)",
];

type Toast = { id: string; type: "info" | "success" | "error"; title: string; detail?: string; txHash?: string };

type CircleWallet = {
  id: string;
  address: string;
  blockchain: string;
};

type GatewayBalanceEntry = {
  domain?: number;
  depositor?: string;
  balance?: string;
  source?: { domain?: number; depositor?: string };
  amount?: string;
  value?: string;
};

type LoginResult = {
  userToken: string;
  encryptionKey: string;
};

type LoginError = {
  message?: string;
};

type AuctionState = {
  phase: number | null;
  leader: string;
  highBid: bigint | null;
  finalized: boolean | null;
  paused: boolean | null;
  biddingOpen: boolean | null;
  timeRemaining: bigint | null;
  admin: string;
  houseNFT: string;
  usdc: string;
};

type HouseState = {
  name: string;
  symbol: string;
  admin: string;
  controller: string;
  currentPhase: number | null;
  ownerOf1: string;
  tokenURI1: string;
};

const shorten = (addr: string) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—");

const formatSeconds = (value: bigint | null) => {
  if (value === null) return "—";
  const total = Number(value);
  if (!Number.isFinite(total)) return "—";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
};

const stringifyWithBigInt = (value: unknown) =>
  JSON.stringify(
    value,
    (_key, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  );

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function ContractsPage() {
  const rpcUrl =
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
  const envUsdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "";

  const rpcProvider = useMemo(() => new ethers.JsonRpcProvider(rpcUrl), [rpcUrl]);

  const sdkRef = useRef<W3SSdk | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const [userToken, setUserToken] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBlockchain, setWalletBlockchain] = useState("");
  const [wallets, setWallets] = useState<CircleWallet[]>([]);

  const [deviceId, setDeviceId] = useState("");
  const [deviceIdLoading, setDeviceIdLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [deviceEncryptionKey, setDeviceEncryptionKey] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);

  const [auctionState, setAuctionState] = useState<AuctionState>({
    phase: null,
    leader: "",
    highBid: null,
    finalized: null,
    paused: null,
    biddingOpen: null,
    timeRemaining: null,
    admin: "",
    houseNFT: "",
    usdc: "",
  });
  const [houseState, setHouseState] = useState<HouseState>({
    name: "",
    symbol: "",
    admin: "",
    controller: "",
    currentPhase: null,
    ownerOf1: "",
    tokenURI1: "",
  });

  const [usdcDecimals, setUsdcDecimals] = useState(6);
  const [usdcSymbol, setUsdcSymbol] = useState("USDC");
  const [usdcBalance, setUsdcBalance] = useState<bigint | null>(null);
  const [usdcAllowance, setUsdcAllowance] = useState<bigint | null>(null);

  const [phaseQuery, setPhaseQuery] = useState(0);
  const [phaseInfo, setPhaseInfo] = useState("{}");

  const [refundQuery, setRefundQuery] = useState("");
  const [refundBalance, setRefundBalance] = useState<bigint | null>(null);

  const [approveAmount, setApproveAmount] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [adminTransfer, setAdminTransfer] = useState("");
  const [controllerInput, setControllerInput] = useState("");
  const [phaseAdvanceInput, setPhaseAdvanceInput] = useState("0");
  const [phaseUriInput, setPhaseUriInput] = useState("");
  const [phaseUriIndex, setPhaseUriIndex] = useState("0");
  const [houseTransferAdmin, setHouseTransferAdmin] = useState("");

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gatewayBalances, setGatewayBalances] = useState<GatewayBalanceEntry[]>([]);
  const [gatewayTotal, setGatewayTotal] = useState<string | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewayError, setGatewayError] = useState("");

  const hasEnvUsdc = ethers.isAddress(envUsdcAddress);
  const isWalletOnBase =
    walletBlockchain.toUpperCase().includes("BASE") &&
    walletBlockchain.toUpperCase().includes("SEPOLIA");
  const baseWallet = useMemo(
    () =>
      wallets.find(
        (w) =>
          w.blockchain?.toUpperCase().includes("BASE") &&
          w.blockchain?.toUpperCase().includes("SEPOLIA"),
      ) ?? null,
    [wallets],
  );
  const hasBaseWallet = Boolean(baseWallet);
  const canSign = Boolean(
    walletAddress && userToken && encryptionKey && walletId && sdkReady && isWalletOnBase,
  );
  const needsLogin = !userToken || !encryptionKey || !walletAddress;

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

  const handleLoginComplete = useCallback(
    (error?: LoginError | null, result?: LoginResult | null) => {
      if (error || !result) {
        const message = error?.message || "Email authentication failed.";
        setLoginError(true);
        setLoginStatus(message);
        pushToast({ type: "error", title: "Login fallido", detail: message });
        return;
      }

      setLoginError(false);
      setLoginStatus("Email verificado. Inicializando wallet...");
      persistSession(result.userToken, result.encryptionKey);
      setUserToken(result.userToken);
      setEncryptionKey(result.encryptionKey);
      pushToast({ type: "success", title: "Email verificado", detail: "Wallet en proceso." });
    },
    [persistSession, pushToast],
  );

  useEffect(() => {
    let cancelled = false;
    const initSdk = async () => {
      try {
        const sdk = new W3SSdk(
          {
            appSettings: { appId },
          },
          (error, result) => {
            if (cancelled) return;
            handleLoginComplete(error as LoginError | null, result as LoginResult | null);
          },
        );
        sdkRef.current = sdk;
        if (!cancelled) {
          setSdkReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setSdkReady(false);
          setLoginError(true);
          setLoginStatus("No se pudo inicializar el SDK.");
        }
      }
    };

    void initSdk();

    return () => {
      cancelled = true;
    };
  }, [handleLoginComplete]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token =
      window.sessionStorage.getItem("w3s_user_token") ||
      window.localStorage.getItem("w3s_user_token");
    const key =
      window.sessionStorage.getItem("w3s_encryption_key") ||
      window.localStorage.getItem("w3s_encryption_key");
    const storedWalletId = window.localStorage.getItem("w3s_wallet_id");
    const storedWalletAddress = window.localStorage.getItem("w3s_wallet_address");
    const storedBlockchain = window.localStorage.getItem("w3s_wallet_blockchain");

    setUserToken(token);
    setEncryptionKey(key);
    setWalletId(storedWalletId);
    setWalletAddress(storedWalletAddress ?? "");
    setWalletBlockchain(storedBlockchain ?? "");
  }, []);

  useEffect(() => {
    const fetchDeviceId = async () => {
      if (!sdkRef.current) return;
      try {
        const cached =
          typeof window !== "undefined" ? window.localStorage.getItem("deviceId") : null;
        if (cached) {
          setDeviceId(cached);
          return;
        }
        setDeviceIdLoading(true);
        const id = await sdkRef.current.getDeviceId();
        setDeviceId(id);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("deviceId", id);
        }
      } catch {
        setLoginError(true);
        setLoginStatus("No se pudo obtener deviceId.");
      } finally {
        setDeviceIdLoading(false);
      }
    };

    if (sdkReady) {
      void fetchDeviceId();
    }
  }, [sdkReady]);

  const loadWallets = useCallback(
    async (token: string) => {
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
        return [];
      }

      const wallets = (data.wallets as CircleWallet[]) || [];
      setWallets(wallets);
      if (wallets.length === 0) return [];

      const baseWallet =
        wallets.find(
          (w) =>
            w.blockchain?.toUpperCase().includes("BASE") &&
            w.blockchain?.toUpperCase().includes("SEPOLIA"),
        ) ?? wallets[0];

      setWalletId(baseWallet.id);
      setWalletAddress(baseWallet.address);
      setWalletBlockchain(baseWallet.blockchain);
      persistWallet(baseWallet);
      return wallets;
    },
    [persistWallet],
  );

  useEffect(() => {
    if (!userToken) return;
    void loadWallets(userToken);
  }, [loadWallets, userToken]);

  const initializeUser = useCallback(async (token: string) => {
    const response = await fetch("/api/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "initializeUser",
        userToken: token,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data?.code === 155106) {
        return { alreadyInitialized: true };
      }
      const msg = data?.error || data?.message || "No se pudo inicializar el usuario";
      throw new Error(msg);
    }

    return { challengeId: data.challengeId as string };
  }, []);

  const handleRequestOtp = useCallback(async () => {
    if (!isEmail(email)) {
      pushToast({ type: "error", title: "Email inválido", detail: "Ingresa un email válido." });
      return;
    }
    if (!deviceId) {
      pushToast({ type: "error", title: "DeviceId faltante", detail: "Espera un momento." });
      return;
    }

    setLoginError(false);
    setLoginStatus("Solicitando OTP...");
    setLoginBusy(true);

    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "requestEmailOtp",
          deviceId,
          email,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || data?.message || "No se pudo enviar OTP.");
      }

      setDeviceToken(data.deviceToken);
      setDeviceEncryptionKey(data.deviceEncryptionKey);
      setOtpToken(data.otpToken);

      const sdk = sdkRef.current;
      if (sdk) {
        sdk.updateConfigs(
          {
            appSettings: { appId },
            loginConfigs: {
              deviceToken: data.deviceToken,
              deviceEncryptionKey: data.deviceEncryptionKey,
              otpToken: data.otpToken,
            },
          },
          handleLoginComplete,
        );
      }

      setLoginStatus("OTP enviado. Abre el panel de verificación.");
      pushToast({ type: "success", title: "OTP enviado", detail: email });
    } catch (error) {
      const err = error as { message?: string };
      setLoginError(true);
      setLoginStatus(err.message || "No se pudo enviar OTP.");
      pushToast({ type: "error", title: "OTP falló", detail: err.message || "Error desconocido" });
    } finally {
      setLoginBusy(false);
    }
  }, [deviceId, email, handleLoginComplete, pushToast]);

  const handleVerifyOtp = useCallback(() => {
    const sdk = sdkRef.current;
    if (!sdk) {
      pushToast({ type: "error", title: "SDK no listo", detail: "Espera un momento." });
      return;
    }
    if (!deviceToken || !deviceEncryptionKey || !otpToken) {
      pushToast({
        type: "error",
        title: "OTP faltante",
        detail: "Primero solicita el código.",
      });
      return;
    }

    sdk.updateConfigs(
      {
        appSettings: { appId },
        loginConfigs: {
          deviceToken,
          deviceEncryptionKey,
          otpToken,
        },
      },
      handleLoginComplete,
    );

    setLoginError(false);
    setLoginStatus("Abriendo panel OTP...");
    sdk.verifyOtp();
  }, [deviceEncryptionKey, deviceToken, otpToken, handleLoginComplete, pushToast]);

  const handleCreateBaseWallet = useCallback(async () => {
    if (!userToken) {
      pushToast({ type: "error", title: "Sesión inválida", detail: "Inicia sesión primero." });
      return;
    }

    try {
      setLoginBusy(true);
      setLoginError(false);
      setLoginStatus("Creando wallet Base Sepolia...");

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createUserWallets",
          userToken,
          accountType: "SCA",
          blockchains: ["BASE-SEPOLIA"],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const msg = data?.error || data?.message || "No se pudo crear la wallet.";
        throw new Error(msg);
      }

      const challengeId = data?.challengeId as string | undefined;
      if (!challengeId) {
        throw new Error("Challenge inválido.");
      }

      await executeChallenge(challengeId);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await loadWallets(userToken);

      setLoginStatus("Wallet Base Sepolia creada.");
      pushToast({ type: "success", title: "Wallet creada", detail: "Base Sepolia lista." });
    } catch (error) {
      const err = error as { message?: string };
      setLoginError(true);
      setLoginStatus(err.message || "No se pudo crear la wallet.");
      pushToast({
        type: "error",
        title: "Error creando wallet",
        detail: err.message || "Error desconocido",
      });
    } finally {
      setLoginBusy(false);
    }
  }, [executeChallenge, loadWallets, pushToast, userToken]);


  const formatUsdc = useCallback(
    (value: bigint | null) => {
      if (value === null) return "—";
      return `${ethers.formatUnits(value, usdcDecimals)} ${usdcSymbol}`;
    },
    [usdcDecimals, usdcSymbol],
  );

  const formatGatewayValue = useCallback((value?: string) => {
    if (!value) return "—";
    try {
      return ethers.formatUnits(BigInt(value), 6);
    } catch {
      return value;
    }
  }, []);

  const safeParseUnits = useCallback(
    (value: string) => {
      const cleaned = value.trim();
      if (!cleaned) return null;
      if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
      try {
        return ethers.parseUnits(cleaned, usdcDecimals);
      } catch {
        return null;
      }
    },
    [usdcDecimals],
  );

  const refreshPhaseInfo = useCallback(
    async (auction: ethers.Contract, phase: number) => {
      try {
        const info = await auction.getPhaseInfo(phase);
        setPhaseInfo(stringifyWithBigInt(info));
      } catch {
        setPhaseInfo("{}");
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const auction = new ethers.Contract(AUCTION_ADDRESS, AUCTION_ABI, rpcProvider);
      const house = new ethers.Contract(HOUSE_ADDRESS, HOUSE_ABI, rpcProvider);

      const [
        usdc,
        houseNFT,
        admin,
        currentPhase,
        currentLeader,
        currentHighBid,
        finalized,
        paused,
        timeRemaining,
      ] = await Promise.all([
        auction.usdc(),
        auction.houseNFT(),
        auction.admin(),
        auction.currentPhase(),
        auction.currentLeader(),
        auction.currentHighBid(),
        auction.finalized(),
        auction.paused(),
        auction.getTimeRemaining(),
      ]);

      let biddingOpen: boolean | null = null;
      try {
        const state = await auction.getAuctionState();
        if (state && typeof state === "object") {
          if ("biddingOpen" in state) {
            biddingOpen = Boolean((state as { biddingOpen?: boolean }).biddingOpen);
          } else if (Array.isArray(state) && typeof state[1] === "boolean") {
            biddingOpen = state[1];
          }
        }
      } catch {
        biddingOpen = null;
      }

      setAuctionState({
        phase: Number(currentPhase),
        leader: currentLeader,
        highBid: currentHighBid,
        finalized: Boolean(finalized),
        paused: Boolean(paused),
        biddingOpen,
        timeRemaining,
        admin,
        houseNFT,
        usdc,
      });

      const [name, symbol, houseAdmin, controller, housePhase, ownerOf1, tokenURI1] =
        await Promise.all([
          house.name(),
          house.symbol(),
          house.admin(),
          house.controller(),
          house.currentPhase(),
          house.ownerOf(1),
          house.tokenURI(1),
        ]);

      setHouseState({
        name,
        symbol,
        admin: houseAdmin,
        controller,
        currentPhase: Number(housePhase),
        ownerOf1,
        tokenURI1,
      });

      const usdcAddressToRead = hasEnvUsdc ? envUsdcAddress : usdc;
      if (ethers.isAddress(usdcAddressToRead)) {
        const usdcContract = new ethers.Contract(usdcAddressToRead, ERC20_ABI, rpcProvider);
        const [decimals, symbol] = await Promise.all([
          usdcContract.decimals(),
          usdcContract.symbol(),
        ]);
        setUsdcDecimals(Number(decimals));
        setUsdcSymbol(symbol);

        if (walletAddress) {
          const [balance, allowance] = await Promise.all([
            usdcContract.balanceOf(walletAddress),
            usdcContract.allowance(walletAddress, AUCTION_ADDRESS),
          ]);
          setUsdcBalance(balance);
          setUsdcAllowance(allowance);
        } else {
          setUsdcBalance(null);
          setUsdcAllowance(null);
        }
      }

      if (walletAddress) {
        try {
          const refund = await auction.refundBalance(walletAddress);
          setRefundBalance(refund);
        } catch {
          setRefundBalance(null);
        }
      } else {
        setRefundBalance(null);
      }

      await refreshPhaseInfo(auction, phaseQuery);
    } catch (error) {
      const err = error as { shortMessage?: string; reason?: string; message?: string };
      pushToast({
        type: "error",
        title: "Error leyendo contratos",
        detail: err.shortMessage || err.reason || err.message || "Error desconocido",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [rpcProvider, walletAddress, envUsdcAddress, hasEnvUsdc, phaseQuery, refreshPhaseInfo, pushToast]);

  const encodeCallData = useCallback((abi: string[], fn: string, args: unknown[]) => {
    const iface = new ethers.Interface(abi);
    return iface.encodeFunctionData(fn, args);
  }, []);

  const executeChallenge = useCallback(
    async (challengeId: string) => {
      const sdk = sdkRef.current;
      if (!sdk || !sdkReady) {
        throw new Error("SDK no listo.");
      }
      if (!userToken || !encryptionKey) {
        throw new Error("Sesión inválida. Inicia sesión en /auth.");
      }

      sdk.setAuthentication({
        userToken,
        encryptionKey,
      });

      return await new Promise<{ transactionHash?: string; txHash?: string } | undefined>(
        (resolve, reject) => {
          sdk.execute(challengeId, (error, result) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(result as { transactionHash?: string; txHash?: string } | undefined);
          });
        },
      );
    },
    [encryptionKey, sdkReady, userToken],
  );

  const bootstrapWallet = useCallback(async () => {
    if (!userToken || !encryptionKey) return;
    if (loginBusy) return;

    setLoginBusy(true);
    setLoginError(false);
    setLoginStatus("Verificando wallets...");

    try {
      const existing = await loadWallets(userToken);
      if (existing.length > 0) {
        setLoginStatus("Wallet lista.");
        return;
      }

      const init = await initializeUser(userToken);
      if (init.alreadyInitialized) {
        const found = await loadWallets(userToken);
        setLoginStatus(found.length > 0 ? "Wallet lista." : "No se encontraron wallets.");
        return;
      }

      if (init.challengeId) {
        setLoginStatus("Creando wallet...");
        await executeChallenge(init.challengeId);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const created = await loadWallets(userToken);
        setLoginStatus(created.length > 0 ? "Wallet creada." : "Wallet creada, pero no se pudo cargar.");
      }
    } catch (error) {
      const err = error as { message?: string };
      setLoginError(true);
      setLoginStatus(err.message || "Error inicializando wallet.");
      pushToast({
        type: "error",
        title: "Error inicializando wallet",
        detail: err.message || "Error desconocido",
      });
    } finally {
      setLoginBusy(false);
    }
  }, [encryptionKey, executeChallenge, initializeUser, loadWallets, loginBusy, pushToast, userToken]);

  useEffect(() => {
    if (!userToken || !encryptionKey) return;
    if (walletAddress) return;
    void bootstrapWallet();
  }, [bootstrapWallet, encryptionKey, userToken, walletAddress]);

  const runTx = useCallback(
    async (label: string, params: { contractAddress: string; callData: string }) => {
      if (!userToken || !walletId || !walletAddress) {
        pushToast({ type: "error", title: "Conecta tu wallet", detail: "Inicia sesión en /auth." });
        return;
      }

      if (!sdkReady) {
        pushToast({ type: "error", title: "SDK no listo", detail: "Espera un momento." });
        return;
      }

      if (!isWalletOnBase) {
        pushToast({
          type: "error",
          title: "Wallet en red distinta",
          detail: `Tu wallet Circle está en ${walletBlockchain || "desconocido"}. Estos contratos viven en Base Sepolia.`,
        });
        return;
      }

      try {
        pushToast({ type: "info", title: label, detail: "Creando challenge..." });

        const response = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createContractExecutionChallenge",
            userToken,
            walletId,
            contractAddress: params.contractAddress,
            callData: params.callData,
            feeLevel: "MEDIUM",
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || data?.message || "No se pudo crear el challenge.");
        }

        const challengeId = data?.challengeId as string | undefined;
        if (!challengeId) {
          throw new Error("Challenge inválido.");
        }

        pushToast({ type: "info", title: label, detail: "Confirma en el panel..." });
        const result = await executeChallenge(challengeId);
        const txHash = result?.transactionHash || result?.txHash;
        if (txHash) {
          setLastTxHash(txHash);
          pushToast({ type: "info", title: label, detail: "Tx enviada.", txHash });
        } else {
          pushToast({ type: "info", title: label, detail: "Tx enviada." });
        }

        await refresh();
        pushToast({ type: "success", title: label, detail: "Confirmada" });
      } catch (error) {
        const err = error as { shortMessage?: string; reason?: string; message?: string };
        pushToast({
          type: "error",
          title: label,
          detail: err.shortMessage || err.reason || err.message || "Error desconocido",
        });
      }
    },
    [
      executeChallenge,
      isWalletOnBase,
      pushToast,
      refresh,
      sdkReady,
      userToken,
      walletAddress,
      walletBlockchain,
      walletId,
    ],
  );

  const handleApprove = async () => {
    if (!hasEnvUsdc) {
      pushToast({ type: "error", title: "USDC env faltante", detail: "Define NEXT_PUBLIC_USDC_ADDRESS." });
      return;
    }
    const amount = safeParseUnits(approveAmount);
    if (!amount) {
      pushToast({ type: "error", title: "Monto inválido", detail: "Ingresa un monto válido." });
      return;
    }

    const callData = encodeCallData(ERC20_ABI, "approve", [AUCTION_ADDRESS, amount]);
    await runTx("Approve USDC", {
      contractAddress: envUsdcAddress,
      callData,
    });
  };

  const handleBid = async () => {
    if (!hasEnvUsdc) {
      pushToast({ type: "error", title: "USDC env faltante", detail: "Define NEXT_PUBLIC_USDC_ADDRESS." });
      return;
    }
    const amount = safeParseUnits(bidAmount);
    if (!amount) {
      pushToast({ type: "error", title: "Monto inválido", detail: "Ingresa un monto válido." });
      return;
    }

    const callData = encodeCallData(AUCTION_ABI, "placeBid", [amount]);
    await runTx("Place Bid", {
      contractAddress: AUCTION_ADDRESS,
      callData,
    });
  };

  const handleWithdraw = async () => {
    const callData = encodeCallData(AUCTION_ABI, "withdraw", []);
    await runTx("Withdraw", {
      contractAddress: AUCTION_ADDRESS,
      callData,
    });
  };

  const handleRefundLookup = async () => {
    const target = refundQuery.trim() || walletAddress;
    if (!target || !ethers.isAddress(target)) {
      pushToast({ type: "error", title: "Address inválida", detail: "Ingresa una address válida." });
      return;
    }
    try {
      const contract = new ethers.Contract(AUCTION_ADDRESS, AUCTION_ABI, rpcProvider);
      const refund = await contract.getBidderRefund(target);
      setRefundBalance(refund);
      pushToast({ type: "success", title: "Refund consultado", detail: shorten(target) });
    } catch (error) {
      const err = error as { shortMessage?: string; reason?: string; message?: string };
      pushToast({
        type: "error",
        title: "Error consultando refund",
        detail: err.shortMessage || err.reason || err.message || "Error desconocido",
      });
    }
  };

  const loadGatewayBalances = useCallback(async (address: string) => {
    setGatewayLoading(true);
    setGatewayError("");
    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "gatewayBalances",
          depositor: address,
          token: "USDC",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || data?.message || "No se pudo cargar balance Gateway.");
      }

      const rawBalances =
        (data?.balances as GatewayBalanceEntry[]) ||
        (data?.data?.balances as GatewayBalanceEntry[]) ||
        [];

      const normalized = rawBalances.map((entry) => ({
        domain: entry.domain ?? entry.source?.domain,
        depositor: entry.depositor ?? entry.source?.depositor,
        balance: entry.balance ?? entry.amount ?? entry.value,
      }));

      setGatewayBalances(normalized);

      let total = 0n;
      let hasNumeric = false;
      normalized.forEach((entry) => {
        if (!entry.balance) return;
        try {
          total += BigInt(entry.balance);
          hasNumeric = true;
        } catch {
          // ignore
        }
      });

      setGatewayTotal(hasNumeric ? ethers.formatUnits(total, 6) : "0");
    } catch (error) {
      const err = error as { message?: string };
      setGatewayError(err?.message || "Error cargando balance Gateway.");
      setGatewayBalances([]);
      setGatewayTotal(null);
    } finally {
      setGatewayLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 12000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!walletAddress) return;
    void loadGatewayBalances(walletAddress);
  }, [loadGatewayBalances, walletAddress]);

  const usdcMismatch =
    hasEnvUsdc &&
    auctionState.usdc &&
    ethers.isAddress(auctionState.usdc) &&
    envUsdcAddress.toLowerCase() !== auctionState.usdc.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Contracts Dashboard</h1>
            <p className="text-sm text-slate-400">
              Lectura vía RPC. Firma con wallet Circle (email OTP). Contratos en Base Sepolia.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={refresh}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold hover:border-slate-500"
            >
              {isRefreshing ? "Actualizando..." : "Refrescar"}
            </button>
            {walletAddress ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold">
                {shorten(walletAddress)}
              </div>
            ) : (
              <a
                href="#circle-login"
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:brightness-110"
              >
                Conectar wallet
              </a>
            )}
          </div>
        </header>

        {walletAddress && !isWalletOnBase && (
          <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Tu wallet Circle está en <b>{walletBlockchain || "desconocido"}</b>. Estos contratos
            viven en <b>Base Sepolia (84532)</b>. Crea una wallet Base Sepolia para firmar aquí.
          </div>
        )}

        {userToken && !hasBaseWallet && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <span>No tienes wallet en Base Sepolia. Créala para ver el balance en Base.</span>
            <button
              type="button"
              onClick={handleCreateBaseWallet}
              disabled={loginBusy}
              className="rounded-xl border border-amber-300/50 bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/30 disabled:opacity-50"
            >
              {loginBusy ? "Creando..." : "Crear wallet Base Sepolia"}
            </button>
          </div>
        )}

        {needsLogin && (
          <div
            id="circle-login"
            className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Conectar wallet Circle</h2>
                <p className="text-sm text-slate-400">
                  Usa el mismo login por email que en <Link href="/auth" className="text-cyan-300">/auth</Link>.
                </p>
              </div>
              {deviceIdLoading && (
                <div className="text-xs text-slate-400">Preparando dispositivo...</div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={!sdkReady || loginBusy || deviceIdLoading}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40"
              >
                Enviar código
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={!sdkReady || loginBusy || !otpToken}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-40"
              >
                Abrir panel de verificación
              </button>
              <span className={`text-sm ${loginError ? "text-rose-300" : "text-slate-400"}`}>
                {loginStatus || "Ingresa tu email para conectar la wallet."}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 grid gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">AuctionManager</h2>
                <a
                  href={`${BASESCAN}/address/${AUCTION_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-300 hover:underline"
                >
                  Ver en BaseScan
                </a>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Phase" value={auctionState.phase ?? "—"} />
                <Info label="Leader" value={auctionState.leader ? shorten(auctionState.leader) : "—"} />
                <Info label="High Bid" value={formatUsdc(auctionState.highBid)} />
                <Info label="Finalized" value={auctionState.finalized === null ? "—" : auctionState.finalized ? "Sí" : "No"} />
                <Info label="Bidding Open" value={auctionState.biddingOpen === null ? "—" : auctionState.biddingOpen ? "Sí" : "No"} />
                <Info label="Paused" value={auctionState.paused === null ? "—" : auctionState.paused ? "Sí" : "No"} />
                <Info label="Time Remaining" value={formatSeconds(auctionState.timeRemaining)} />
                <Info label="Admin" value={auctionState.admin ? shorten(auctionState.admin) : "—"} />
                <Info label="HouseNFT" value={auctionState.houseNFT ? shorten(auctionState.houseNFT) : "—"} />
                <Info label="USDC" value={auctionState.usdc ? shorten(auctionState.usdc) : "—"} />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="text-sm font-semibold">Consultar fase</div>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    value={phaseQuery}
                    onChange={(e) => setPhaseQuery(Number(e.target.value))}
                    className="w-24 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={refresh}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1 text-sm"
                  >
                    Ver info
                  </button>
                </div>
                <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-slate-200">
{phaseInfo}
                </pre>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">HouseNFT</h2>
                <a
                  href={`${BASESCAN}/address/${HOUSE_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-300 hover:underline"
                >
                  Ver en BaseScan
                </a>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Name" value={houseState.name || "—"} />
                <Info label="Symbol" value={houseState.symbol || "—"} />
                <Info label="Admin" value={houseState.admin ? shorten(houseState.admin) : "—"} />
                <Info label="Controller" value={houseState.controller ? shorten(houseState.controller) : "—"} />
                <Info label="Current Phase" value={houseState.currentPhase ?? "—"} />
                <Info label="OwnerOf(1)" value={houseState.ownerOf1 ? shorten(houseState.ownerOf1) : "—"} />
              </div>
              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-200">
                TokenURI(1): {houseState.tokenURI1 || "—"}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold">USDC</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Info label="Env USDC" value={hasEnvUsdc ? envUsdcAddress : "No configurado"} />
                <Info label="Auction usdc()" value={auctionState.usdc || "—"} />
                <Info label="Decimals" value={usdcDecimals} />
                <Info label="Symbol" value={usdcSymbol} />
              </div>

              {usdcMismatch && (
                <div className="mt-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  Warning: NEXT_PUBLIC_USDC_ADDRESS no coincide con auction.usdc().
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Balance" value={walletAddress ? formatUsdc(usdcBalance) : "—"} />
                <Info label="Allowance" value={walletAddress ? formatUsdc(usdcAllowance) : "—"} />
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="text-xs text-slate-400">Approve amount (USDC)</label>
                  <input
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(e.target.value)}
                    placeholder="100"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    disabled={!canSign || !hasEnvUsdc}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={!canSign || !hasEnvUsdc}
                  className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40"
                >
                  Approve
                </button>
              </div>
            </div>
          </section>

          <aside className="grid gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold">Usuario</h2>
              <div className="mt-2 text-xs text-slate-400">
                {walletAddress ? `Conectado: ${shorten(walletAddress)}` : "Modo lectura (sin wallet)"}
              </div>
              {walletAddress && (
                <div className="mt-1 text-[11px] text-slate-500">
                  Blockchain: {walletBlockchain || "—"}
                </div>
              )}

              <div className="mt-4">
                <label className="text-xs text-slate-400">Bid amount (USDC)</label>
                <input
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="25"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  disabled={!canSign || !hasEnvUsdc}
                />
                <button
                  type="button"
                  onClick={handleBid}
                  disabled={!canSign || !hasEnvUsdc}
                  className="mt-3 w-full rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40"
                >
                  placeBid()
                </button>
              </div>

              <button
                type="button"
                onClick={handleWithdraw}
                disabled={!canSign}
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm disabled:opacity-40"
              >
                withdraw()
              </button>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-xs text-slate-400">Refund balance</div>
                <div className="mt-1 text-sm">{formatUsdc(refundBalance)}</div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={refundQuery}
                    onChange={(e) => setRefundQuery(e.target.value)}
                    placeholder="address opcional"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleRefundLookup}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  >
                    Consultar
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-xs text-slate-400">Gateway unified balance (USDC)</div>
                <div className="mt-1 text-sm">
                  {gatewayLoading ? "Cargando..." : gatewayTotal ?? "—"}
                </div>
                {gatewayError && (
                  <div className="mt-1 text-xs text-rose-300">{gatewayError}</div>
                )}
                {gatewayBalances.length > 0 && (
                  <div className="mt-2 text-[11px] text-slate-400">
                    {gatewayBalances.map((b, idx) => (
                      <div key={`${b.domain ?? "unknown"}-${idx}`}>
                        Domain {b.domain ?? "?"}:{" "}
                        {formatGatewayValue(b.balance)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold">Admin AuctionManager</h2>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() =>
                    runTx("advancePhase", {
                      contractAddress: AUCTION_ADDRESS,
                      callData: encodeCallData(AUCTION_ABI, "advancePhase", []),
                    })
                  }
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  disabled={!canSign}
                >
                  advancePhase()
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runTx("finalizeAuction", {
                      contractAddress: AUCTION_ADDRESS,
                      callData: encodeCallData(AUCTION_ABI, "finalizeAuction", []),
                    })
                  }
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  disabled={!canSign}
                >
                  finalizeAuction()
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runTx("withdrawProceeds", {
                      contractAddress: AUCTION_ADDRESS,
                      callData: encodeCallData(AUCTION_ABI, "withdrawProceeds", []),
                    })
                  }
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  disabled={!canSign}
                >
                  withdrawProceeds()
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runTx("pause", {
                      contractAddress: AUCTION_ADDRESS,
                      callData: encodeCallData(AUCTION_ABI, "pause", []),
                    })
                  }
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  disabled={!canSign}
                >
                  pause()
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runTx("unpause", {
                      contractAddress: AUCTION_ADDRESS,
                      callData: encodeCallData(AUCTION_ABI, "unpause", []),
                    })
                  }
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  disabled={!canSign}
                >
                  unpause()
                </button>
              </div>

              <div className="mt-4">
                <label className="text-xs text-slate-400">transferAdmin(newAdmin)</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={adminTransfer}
                    onChange={(e) => setAdminTransfer(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!ethers.isAddress(adminTransfer)) {
                        pushToast({
                          type: "error",
                          title: "Address inválida",
                          detail: "Ingresa una address válida.",
                        });
                        return;
                      }
                      void runTx("transferAdmin", {
                        contractAddress: AUCTION_ADDRESS,
                        callData: encodeCallData(AUCTION_ABI, "transferAdmin", [adminTransfer]),
                      });
                    }}
                    className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950"
                    disabled={!canSign}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold">Admin HouseNFT</h2>

              <div className="mt-3">
                <label className="text-xs text-slate-400">setController(address)</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={controllerInput}
                    onChange={(e) => setControllerInput(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!ethers.isAddress(controllerInput)) {
                        pushToast({
                          type: "error",
                          title: "Address inválida",
                          detail: "Ingresa una address válida.",
                        });
                        return;
                      }
                      void runTx("setController", {
                        contractAddress: HOUSE_ADDRESS,
                        callData: encodeCallData(HOUSE_ABI, "setController", [controllerInput]),
                      });
                    }}
                    className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950"
                    disabled={!canSign}
                  >
                    Enviar
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-slate-400">advancePhase(uint8)</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={phaseAdvanceInput}
                    onChange={(e) => setPhaseAdvanceInput(e.target.value)}
                    placeholder="0..3"
                    className="w-24 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nextPhase = Number(phaseAdvanceInput);
                      if (!Number.isFinite(nextPhase) || nextPhase < 0 || nextPhase > 3) {
                        pushToast({
                          type: "error",
                          title: "Phase inválida",
                          detail: "Debe estar entre 0 y 3.",
                        });
                        return;
                      }
                      void runTx("advancePhase", {
                        contractAddress: HOUSE_ADDRESS,
                        callData: encodeCallData(HOUSE_ABI, "advancePhase", [nextPhase]),
                      });
                    }}
                    className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950"
                    disabled={!canSign}
                  >
                    Enviar
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-slate-400">updatePhaseURI(phase, uri)</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-[80px_1fr]">
                  <input
                    value={phaseUriIndex}
                    onChange={(e) => setPhaseUriIndex(e.target.value)}
                    placeholder="0"
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  />
                  <input
                    value={phaseUriInput}
                    onChange={(e) => setPhaseUriInput(e.target.value)}
                    placeholder="ipfs://..."
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const phase = Number(phaseUriIndex);
                    if (!Number.isFinite(phase) || phase < 0 || phase > 3) {
                      pushToast({
                        type: "error",
                        title: "Phase inválida",
                        detail: "Debe estar entre 0 y 3.",
                      });
                      return;
                    }
                    if (!phaseUriInput.trim()) {
                      pushToast({
                        type: "error",
                        title: "URI inválida",
                        detail: "Ingresa una URI válida.",
                      });
                      return;
                    }
                    void runTx("updatePhaseURI", {
                      contractAddress: HOUSE_ADDRESS,
                      callData: encodeCallData(HOUSE_ABI, "updatePhaseURI", [phase, phaseUriInput.trim()]),
                    });
                  }}
                  className="mt-2 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950"
                  disabled={!canSign}
                >
                  Enviar
                </button>
              </div>

              <div className="mt-4">
                <label className="text-xs text-slate-400">transferAdmin(newAdmin)</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={houseTransferAdmin}
                    onChange={(e) => setHouseTransferAdmin(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!ethers.isAddress(houseTransferAdmin)) {
                        pushToast({
                          type: "error",
                          title: "Address inválida",
                          detail: "Ingresa una address válida.",
                        });
                        return;
                      }
                      void runTx("transferAdmin", {
                        contractAddress: HOUSE_ADDRESS,
                        callData: encodeCallData(HOUSE_ABI, "transferAdmin", [houseTransferAdmin]),
                      });
                    }}
                    className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950"
                    disabled={!canSign}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {lastTxHash && (
          <div className="mt-6 text-xs text-slate-400">
            Última tx: {" "}
            <a
              className="text-cyan-300 hover:underline"
              href={`${BASESCAN}/tx/${lastTxHash}`}
              target="_blank"
              rel="noreferrer"
            >
              {lastTxHash}
            </a>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-80 rounded-2xl border px-4 py-3 text-sm shadow-lg ${
              toast.type === "success"
                ? "border-emerald-400/40 bg-emerald-500/10"
                : toast.type === "error"
                  ? "border-rose-400/40 bg-rose-500/10"
                  : "border-slate-700 bg-slate-900"
            }`}
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.detail && <div className="mt-1 text-xs text-slate-200/80">{toast.detail}</div>}
            {toast.txHash && (
              <a
                className="mt-1 inline-block text-xs text-cyan-300 hover:underline"
                href={`${BASESCAN}/tx/${toast.txHash}`}
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

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-1 text-sm text-slate-100 break-all">{value}</div>
    </div>
  );
}
