"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDisconnect, useReadContract, useWriteContract, useAccount } from "wagmi";
import { formatUnits, parseUnits, isAddress } from "viem";
import { erc20Abi } from "@/lib/contracts";
import Header from "../components/Header";
import { base, baseSepolia } from "wagmi/chains";
import { getChainMeta, getContractsForChain } from "@/lib/contracts";

const USDC_DECIMALS = 6;

export default function CuentaPage() {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  const { isConnected, address, chainId } = useAccount();
  
  // Get chain info
  const currentChainId = (chainId ?? 84532) as 8453 | 84532;
  const chain = currentChainId === 8453 ? base : baseSepolia;
  const chainMeta = getChainMeta(currentChainId);
  const contracts = getContractsForChain(currentChainId);

  const ui = useMemo(
    () => ({
      bg: "bg-[#07090A]",
      card: "bg-white/[0.04] border border-white/[0.08] shadow-[0_18px_70px_rgba(0,0,0,0.65)]",
      muted: "text-white/60",
      teal: "text-[#2DD4D4]",
    }),
    [],
  );

  const [status, setStatus] = useState("Cargando...");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [amount, setAmount] = useState("1");
  const [sending, setSending] = useState(false);

  const { data: usdcBalanceRaw, refetch: refetchBalance } = useReadContract({
    address: contracts.USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const usdcBalance = usdcBalanceRaw != null ? formatUnits(usdcBalanceRaw, USDC_DECIMALS) : null;

  useEffect(() => {
    if (isConnected) {
      setStatus("Listo.");
    } else {
      setStatus("Necesitas iniciar sesion.");
    }
  }, [isConnected]);

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
      return { normalized, value: null, isValid: false, error: "Ingresa un monto valido." };
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
        return { normalized, value: null, isValid: false, error: "Ingresa un monto valido." };
      }
      return { normalized, value: parsed, isValid: true };
    } catch {
      return { normalized, value: null, isValid: false, error: "Ingresa un monto valido." };
    }
  }, [amount, normalizeDecimalInput]);

  const handleLogout = () => {
    disconnect();
    setStatus("Sesion cerrada.");
    router.push("/marketplace");
  };

  useEffect(() => {
    if (
      status === "Ingresa un monto valido." ||
      status === "USDC admite hasta 6 decimales." ||
      status === "La direccion destino no es valida."
    ) {
      setStatus("");
    }
  }, [amount, destinationAddress, status]);

  const handleSend = async () => {
    if (!address) {
      setStatus("No encontramos wallet.");
      return;
    }

    if (!isAddress(destinationAddress)) {
      setStatus("La direccion destino no es valida.");
      return;
    }

    if (!parsedAmount.isValid || !parsedAmount.value) {
      setStatus(parsedAmount.error || "Ingresa un monto valido.");
      return;
    }

    setSending(true);
    try {
      setStatus("Enviando transferencia...");

      const hash = await writeContractAsync({
        address: contracts.USDC,
        abi: erc20Abi,
        functionName: "transfer",
        args: [destinationAddress as `0x${string}`, parsedAmount.value],
      });

      setStatus(hash ? `Transferencia enviada. TX: ${hash.slice(0, 14)}...` : "Transferencia enviada.");
      await refetchBalance();
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Error enviando la transferencia.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`min-h-screen text-white ${ui.bg}`}>
      <Header />

      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(45,212,212,0.10),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(255,255,255,0.05),transparent_55%),radial-gradient(circle_at_20%_70%,rgba(45,212,212,0.06),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-10">
        <div className="w-full max-w-[760px] mx-auto">
          <div className="mb-6 flex items-center justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.06] transition"
            >
              Cerrar sesion
            </button>
          </div>

          <div className={`rounded-[28px] px-6 py-8 sm:px-8 ${ui.card}`}>
            <h1 className="text-3xl font-semibold tracking-tight">Mi wallet</h1>
            <p className={`mt-2 text-sm ${ui.muted}`}>
              Direccion, balance y envio de USDC en Base Sepolia.
            </p>

            {!isConnected && (
              <div className="mt-6 rounded-[18px] border border-white/[0.12] bg-white/[0.03] px-4 py-4 text-sm text-white/70">
                {status}{" "}
                <Link href="/" className={ui.teal}>
                  Inicia sesion
                </Link>
              </div>
            )}

            {isConnected && address && (
              <div className="mt-6 grid gap-6">
                <div className="rounded-[18px] border border-white/[0.10] bg-black/30 p-4">
                  <div className="text-xs text-white/55">Direccion</div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 break-all rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/90">
                    <span className="flex-1">{address}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(address)}
                      className="rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 text-xs text-white/70 hover:bg-white/[0.06] transition"
                    >
                      Copiar
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-white/55">Network</div>
                  <div className="mt-2 rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/90">
                    Base Sepolia
                  </div>

                  <div className="mt-4 text-xs text-white/55">Balance USDC</div>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/90">
                    <span className="flex-1">{usdcBalance ?? "..."}</span>
                    <button
                      type="button"
                      onClick={() => refetchBalance()}
                      className="rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 text-[11px] text-white/70 hover:bg-white/[0.06] transition"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>

                <div className="rounded-[18px] border border-white/[0.10] bg-black/30 p-4">
                  <div className="text-sm font-semibold">Enviar USDC</div>
                  <div className="mt-2 text-xs text-white/55">
                    Ingresa la direccion destino y el monto.
                  </div>

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
                        Base units: {parsedAmount.value ? parsedAmount.value.toString() : "..."}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sending}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        sending
                          ? "bg-white/10 text-white/50 cursor-not-allowed"
                          : "bg-[#2DD4D4] text-black hover:brightness-110"
                      }`}
                    >
                      {sending ? "Enviando..." : "Enviar"}
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
