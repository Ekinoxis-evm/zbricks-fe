import { formatUnits } from "viem";
import { CHAIN_META } from "@/lib/contracts";

export const shorten = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—";

export const formatUsdc = (amount: bigint | null | undefined) =>
  amount == null ? "—" : `${formatUnits(amount, 6)} USDC`;

export const formatTime = (seconds: bigint | null | undefined) => {
  if (seconds == null) return "—";
  const s = Number(seconds);
  if (s <= 0) return "0s";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const daysToSeconds = (days: string) =>
  BigInt(Math.round(parseFloat(days || "0") * 86400));

export const explorerAddress = (addr: string) =>
  `${CHAIN_META.explorer}/address/${addr}`;

export const explorerTx = (hash: string) =>
  `${CHAIN_META.explorer}/tx/${hash}`;
