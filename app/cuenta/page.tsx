"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import { formatUnits, isAddress, parseUnits } from "@/lib/circle/evm";

type Wallet = {
  id: string;
  address: string;
  blockchain: string;
};

type TokenBalanceEntry = {
  amount?: string;
  token?: {
    id?: string;
    symbol?: string;
    name?: string;
    address?: string;
    blockchain?: string;
  };
  tokenId?: string;
  tokenAddress?: string;
  blockchain?: string;
};

type GatewayBalanceEntry = {
  domain?: number;
  depositor?: string;
  balance?: string;
};

type ChallengeExecuteResult = {
  transactionHash?: string;
  txHash?: string;
};

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;
const USDC_DECIMALS = 6;
const GATEWAY_TESTNET_DOMAINS = [
  { label: "Arc Testnet", domainId: 26 },
  { label: "Avalanche Fuji", domainId: 1 },
  { label: "Base Sepolia", domainId: 6 },
  { label: "Ethereum Sepolia", domainId: 0 },
  { label: "HyperEVM Testnet", domainId: 19 },
  { label: "Sei Atlantic", domainId: 16 },
  { label: "Sonic Testnet", domainId: 13 },
  { label: "World Chain Sepolia", domainId: 14 },
];

const DOMAIN_LABELS: Record<number, string> = GATEWAY_TESTNET_DOMAINS.reduce(
  (acc, chain) => {
    acc[chain.domainId] = chain.label;
    return acc;
  },
  {} as Record<number, string>,
);

const getSessionValue = (key: string) => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
};

export default function CuentaPage() {
  const router = useRouter();
  const sdkRef = useRef<W3SSdk | null>(null);

  const ui = useMemo(
    () => ({
      bg: "bg-[#07090A]",
      card: "bg-white/[0.04] border border-white/[0.08] shadow-[0_18px_70px_rgba(0,0,0,0.65)]",
      muted: "text-white/60",
      teal: "text-[#2DD4D4]",
    }),
    [],
  );

  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Cargando...");

  const [userToken, setUserToken] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [usdcTokenId, setUsdcTokenId] = useState<string | null>(null);
  const [usdcTokenAddress, setUsdcTokenAddress] = useState<string | null>(null);
  const [usdcTokenBlockchain, setUsdcTokenBlockchain] = useState<string | null>(null);
  const [gatewayBalances, setGatewayBalances] = useState<GatewayBalanceEntry[]>([]);
  const [gatewayTotal, setGatewayTotal] = useState<string | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);

  const [destinationAddress, setDestinationAddress] = useState("");
  const [amount, setAmount] = useState("1");
  const [sending, setSending] = useState(false);

  const normalizeDecimalInput = useCallback((value: string) => {
    let cleaned = value.replace(/\s+/g, "").trim();
    if (!cleaned) return "";

    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");

    if (hasComma && hasDot) {
      const lastComma = cleaned.lastIndexOf(",");
      const lastDot = cleaned.lastIndexOf(".");
      const decimalSep = lastComma > lastDot ? "," : ".";
      const thousandSep = decimalSep === "," ? "." : ",";
      cleaned = cleaned.replace(new RegExp(`\\${thousandSep}`, "g"), "");
      cleaned = cleaned.replace(decimalSep, ".");
    } else if (hasComma) {
      cleaned = cleaned.replace(/,/g, ".");
    }

    cleaned = cleaned.replace(/[^0-9.]/g, "");

    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = `${parts.shift()}.${parts.join("")}`;
    }

    return cleaned;
  }, []);

  const parsedAmount = useMemo(() => {
    const normalized = normalizeDecimalInput(amount || "");

    if (!normalized || normalized === ".") {
      return { normalized, value: null, isValid: false, error: "Ingresa un monto válido." };
    }

    if (!/^\d+(\.\d{0,6})?$/.test(normalized)) {
      return {
        normalized,
        value: null,
        isValid: false,
        error: "USDC admite hasta 6 decimales.",
      };
    }

    try {
      const parsed = parseUnits(normalized, USDC_DECIMALS);
      if (parsed <= 0n) {
        return { normalized, value: null, isValid: false, error: "Ingresa un monto válido." };
      }
      return { normalized, value: parsed, isValid: true };
    } catch {
      return { normalized, value: null, isValid: false, error: "Ingresa un monto válido." };
    }
  }, [amount, normalizeDecimalInput]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("w3s_user_token");
      window.sessionStorage.removeItem("w3s_encryption_key");
      window.localStorage.removeItem("w3s_user_token");
      window.localStorage.removeItem("w3s_wallet_id");
      window.localStorage.removeItem("w3s_wallet_address");
      window.localStorage.removeItem("w3s_wallet_blockchain");
      window.localStorage.removeItem("w3s_wallet_usdc");
    }
    setWallet(null);
    setUsdcBalance(null);
    setStatus("Sesión cerrada.");
    router.push("/marketplace");
  };

  useEffect(() => {
    const token = getSessionValue("w3s_user_token");
    const key = getSessionValue("w3s_encryption_key");

    setUserToken(token);
    setEncryptionKey(key);

    const sdk = new W3SSdk({
      appSettings: { appId },
    });
    sdkRef.current = sdk;
    setSdkReady(true);
  }, []);

  const loadWallet = useCallback(async (token: string) => {
    setStatus("Cargando wallet...");

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
      throw new Error(data?.error || data?.message || "No se pudo cargar la wallet.");
    }

    const wallets = (data.wallets as Wallet[]) || [];
    setWallets(wallets);
    const primary =
      wallets.find(
        (w) =>
          w.blockchain?.toUpperCase().includes("BASE") &&
          w.blockchain?.toUpperCase().includes("SEPOLIA"),
      ) ?? wallets[0] ?? null;
    setWallet(primary);

    if (primary && typeof window !== "undefined") {
      window.localStorage.setItem("w3s_wallet_id", primary.id);
      window.localStorage.setItem("w3s_wallet_address", primary.address);
      window.localStorage.setItem("w3s_wallet_blockchain", primary.blockchain);
    }

    return primary;
  }, []);

  const loadBalance = useCallback(async (token: string, walletId: string) => {
    const response = await fetch("/api/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getTokenBalance",
        userToken: token,
        walletId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "No se pudo cargar balance.");
    }

    const balances = (data.tokenBalances as TokenBalanceEntry[]) || [];
    const usdcEntry =
      balances.find((t) => {
        const symbol = t.token?.symbol || "";
        const name = t.token?.name || "";
        return symbol.toUpperCase().includes("USDC") || name.toUpperCase().includes("USDC");
      }) ?? null;

    setUsdcBalance(usdcEntry?.amount ?? "0");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("w3s_wallet_usdc", usdcEntry?.amount ?? "0");
    }

    const tokenId = usdcEntry?.token?.id ?? usdcEntry?.tokenId ?? null;
    const tokenAddress = usdcEntry?.token?.address ?? usdcEntry?.tokenAddress ?? null;
    const tokenBlockchain =
      usdcEntry?.token?.blockchain ?? usdcEntry?.blockchain ?? wallet?.blockchain ?? null;

    setUsdcTokenId(tokenId);
    setUsdcTokenAddress(tokenAddress);
    setUsdcTokenBlockchain(tokenBlockchain);
  }, [wallet?.blockchain]);

  const loadGatewayBalances = useCallback(async (depositor: string) => {
    setGatewayLoading(true);
    setGatewayError(null);

    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "gatewayBalances",
          depositor,
          token: "USDC",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "No se pudo cargar balance unificado.");
      }

      const rawBalances =
        (data?.balances as GatewayBalanceEntry[]) ||
        (data?.data?.balances as GatewayBalanceEntry[]) ||
        [];

      if (rawBalances.length === 0) {
        setGatewayBalances([]);
        setGatewayTotal("0");
        return;
      }

      const normalizedBalances = rawBalances.map((entry) => ({
        domain: entry?.domain ?? (entry as { source?: { domain?: number } })?.source?.domain,
        depositor:
          entry?.depositor ??
          (entry as { source?: { depositor?: string } })?.source?.depositor,
        balance:
          entry?.balance ??
          (entry as { amount?: string })?.amount ??
          (entry as { value?: string })?.value,
      }));

      setGatewayBalances(normalizedBalances);

      let total = 0n;
      let hasNumeric = false;
      normalizedBalances.forEach((entry) => {
        if (!entry.balance) return;
        try {
          total += BigInt(entry.balance);
          hasNumeric = true;
        } catch {
          // ignore non-numeric
        }
      });

      setGatewayTotal(hasNumeric ? formatUnits(total, USDC_DECIMALS) : null);
    } catch (err: unknown) {
      setGatewayError(err instanceof Error ? err.message : "Error cargando balance unificado.");
      setGatewayBalances([]);
      setGatewayTotal(null);
    } finally {
      setGatewayLoading(false);
    }
  }, []);

  const formatGatewayBalance = useCallback((balance?: string) => {
    if (!balance) return "—";
    try {
      return formatUnits(BigInt(balance), USDC_DECIMALS);
    } catch {
      return balance;
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!userToken) {
        setStatus("Necesitas iniciar sesión.");
        setLoading(false);
        return;
      }

      try {
        const primary = await loadWallet(userToken);

        if (!primary) {
          setStatus("No encontramos una wallet aún.");
          setLoading(false);
          return;
        }

        await loadBalance(userToken, primary.id);
        await loadGatewayBalances(primary.address);
        setStatus("Listo.");
        setLoading(false);
      } catch (err: unknown) {
        setStatus(err instanceof Error ? err.message : "Error cargando la wallet.");
        setLoading(false);
      }
    };

    void load();
  }, [loadBalance, loadGatewayBalances, loadWallet, userToken]);

  useEffect(() => {
    if (
      status === "Ingresa un monto válido." ||
      status === "USDC admite hasta 6 decimales." ||
      status === "La dirección destino no es válida."
    ) {
      setStatus("");
    }
  }, [amount, destinationAddress, status]);

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

  const createTransferChallenge = useCallback(
    async (payload: {
      walletId: string;
      destinationAddress: string;
      amount: string;
      tokenId?: string | null;
      tokenAddress?: string | null;
      tokenBlockchain?: string | null;
    }) => {
      if (!userToken) {
        throw new Error("Sesión inválida. Vuelve a iniciar sesión.");
      }

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createTransferChallenge",
          userToken,
          walletId: payload.walletId,
          destinationAddress: payload.destinationAddress,
          amounts: [payload.amount],
          tokenId: payload.tokenId ?? undefined,
          tokenAddress: payload.tokenAddress ?? undefined,
          blockchain: payload.tokenBlockchain ?? undefined,
          feeLevel: "MEDIUM",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "No se pudo crear la transferencia.");
      }

      if (!data?.challengeId) {
        throw new Error("Challenge inválido.");
      }

      return data.challengeId as string;
    },
    [userToken],
  );

  const handleSend = async () => {
    if (!wallet) {
      setStatus("No encontramos wallet.");
      return;
    }

    if (!isAddress(destinationAddress)) {
      setStatus("La dirección destino no es válida.");
      return;
    }

    if (!parsedAmount.isValid) {
      setStatus(parsedAmount.error || "Ingresa un monto válido.");
      return;
    }

    if (!usdcTokenId && !usdcTokenAddress) {
      setStatus("No se encontró token USDC en la wallet.");
      return;
    }

    setSending(true);
    try {
      setStatus("Creando transferencia...");
      const challengeId = await createTransferChallenge({
        walletId: wallet.id,
        destinationAddress,
        amount: parsedAmount.normalized,
        tokenId: usdcTokenId,
        tokenAddress: usdcTokenAddress,
        tokenBlockchain: usdcTokenBlockchain ?? wallet.blockchain,
      });

      setStatus("Confirma en el panel...");
      const result = await executeChallenge(challengeId);
      const hash = result?.transactionHash || result?.txHash;
      setStatus(hash ? `Transferencia enviada. Tx: ${hash}` : "Transferencia enviada.");

      if (userToken) {
        await loadBalance(userToken, wallet.id);
      }
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Error enviando la transferencia.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`min-h-screen text-white ${ui.bg}`}>
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(45,212,212,0.10),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(255,255,255,0.05),transparent_55%),radial-gradient(circle_at_20%_70%,rgba(45,212,212,0.06),transparent_60%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-[760px]">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/marketplace"
              className="rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.06] transition"
            >
              ← Volver
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.06] transition"
            >
              Cerrar sesión
            </button>
          </div>

          <div className={`rounded-[28px] px-6 py-8 sm:px-8 ${ui.card}`}>
            <h1 className="text-3xl font-semibold tracking-tight">Mi wallet</h1>
            <p className={`mt-2 text-sm ${ui.muted}`}>
              Dirección, balance y envío de USDC.
            </p>

            {!wallet && !loading && (
              <div className="mt-6 rounded-[18px] border border-white/[0.12] bg-white/[0.03] px-4 py-4 text-sm text-white/70">
                {status}{" "}
                <Link href="/auth" className={ui.teal}>
                  Inicia sesión
                </Link>
              </div>
            )}

            {wallet && (
              <div className="mt-6 grid gap-6">
                <div className="rounded-[18px] border border-white/[0.10] bg-black/30 p-4">
                  <div className="text-xs text-white/55">Dirección</div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 break-all rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/90">
                    <span className="flex-1">{wallet.address}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(wallet.address)}
                      className="rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 text-xs text-white/70 hover:bg-white/[0.06] transition"
                    >
                      Copiar
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-white/55">Blockchain</div>
                  <div className="mt-2 rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/90">
                    {wallet.blockchain}
                  </div>

                  <div className="mt-4 text-xs text-white/55">Balance USDC</div>
                  <div className="mt-2 rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/90">
                    {usdcBalance ?? "—"}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-white/55">
                    <span>Balance unificado (Gateway)</span>
                    <button
                      type="button"
                      onClick={() => wallet && loadGatewayBalances(wallet.address)}
                      className="rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 text-[11px] text-white/70 hover:bg-white/[0.06] transition"
                    >
                      Actualizar
                    </button>
                  </div>
                  <div className="mt-2 rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/90">
                    {gatewayLoading ? "Cargando..." : gatewayTotal ?? "—"}
                  </div>
                  <div className="mt-2 text-[11px] text-white/55">
                    Balance unificado solo muestra depósitos al contrato GatewayWallet en
                    testnet y puede tardar algunos minutos en reflejarse.
                  </div>
                  {gatewayError && (
                    <div className="mt-2 text-xs text-red-300">{gatewayError}</div>
                  )}
                  {gatewayBalances.length > 0 && (
                    <div className="mt-3 grid gap-2 text-xs text-white/70">
                      {gatewayBalances.map((entry, index) => {
                        const label =
                          entry.domain === undefined
                            ? "Dominio desconocido"
                            : DOMAIN_LABELS[entry.domain] ?? `Domain ${entry.domain}`;
                        return (
                          <div
                            key={`${entry.domain ?? "unknown"}-${index}`}
                            className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2"
                          >
                            <span>{label}</span>
                            <span>{formatGatewayBalance(entry.balance)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-[18px] border border-white/[0.10] bg-black/30 p-4">
                  <div className="text-sm font-semibold">Enviar USDC</div>
                  <div className="mt-2 text-xs text-white/55">
                    Ingresa la dirección destino y el monto.
                  </div>

                  {!sdkReady && (
                    <div className="mt-3 rounded-2xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-xs text-white/70">
                      SDK inicializando...
                    </div>
                  )}

                  {!encryptionKey && (
                    <div className="mt-3 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100">
                      Esta sesión no tiene encryptionKey. Vuelve a /auth y verifica el email.
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-white/55">Wallet destino</label>
                      <input
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        placeholder="0x..."
                        className="mt-2 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-sm text-white/90"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-white/55">Monto USDC</label>
                      <input
                        value={amount}
                        onChange={(e) => setAmount(normalizeDecimalInput(e.target.value))}
                        placeholder="5.0"
                        inputMode="decimal"
                        pattern="^[0-9.,]*$"
                        className="mt-2 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-sm text-white/90"
                      />
                      <div className="mt-1 text-[11px] text-white/45">
                        Base units: {parsedAmount.value ? parsedAmount.value.toString() : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sending || !sdkReady}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        sending || !sdkReady
                          ? "bg-white/10 text-white/50 cursor-not-allowed"
                          : "bg-[#2DD4D4] text-black hover:brightness-110"
                      }`}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={`mt-4 text-xs ${ui.muted}`}>{status}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
