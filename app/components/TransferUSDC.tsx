"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useWriteContract, useReadContract, useAccount } from "wagmi";
import { formatUnits, parseUnits, isAddress } from "viem";
import { erc20Abi, getContractsForChain } from "@/lib/contracts";
import Card, { CardHeader, CardTitle, CardContent } from "./Card";
import Button from "./Button";

const USDC_DECIMALS = 6;
const SUPPORTED_CHAINS = [
  { id: 84532, name: "Base Sepolia", shortName: "Sepolia" },
  { id: 8453, name: "Base Mainnet", shortName: "Base" },
];

interface TransferUSDCProps {
  onClose?: () => void;
}

export default function TransferUSDC({ onClose }: TransferUSDCProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [selectedChain, setSelectedChain] = useState<number>(84532);
  const contracts = getContractsForChain(selectedChain as any);

  const [destinationAddress, setDestinationAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");

  const { data: balanceRaw, refetch: refetchBalance } = useReadContract({
    address: contracts.USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: selectedChain,
  });

  const balance = balanceRaw ? parseFloat(formatUnits(balanceRaw, USDC_DECIMALS)) : 0;

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
      return { normalized, value: null, isValid: false };
    }

    if (!/^\d+(\.\d{0,6})?$/.test(normalized)) {
      return { normalized, value: null, isValid: false };
    }

    try {
      const parsed = parseUnits(normalized, USDC_DECIMALS);
      if (parsed <= 0n) {
        return { normalized, value: null, isValid: false };
      }

      if (parsed > balanceRaw || !balanceRaw) {
        return { normalized, value: null, isValid: false };
      }

      return { normalized, value: parsed, isValid: true };
    } catch {
      return { normalized, value: null, isValid: false };
    }
  }, [amount, normalizeDecimalInput, balanceRaw]);

  const handleSend = async () => {
    if (!address) {
      setStatus("Wallet not found");
      setStatusType("error");
      return;
    }

    if (!isAddress(destinationAddress)) {
      setStatus("Invalid recipient address");
      setStatusType("error");
      return;
    }

    if (!parsedAmount.isValid || !parsedAmount.value) {
      setStatus("Invalid amount or insufficient balance");
      setStatusType("error");
      return;
    }

    setSending(true);
    setStatus("Sending transfer...");
    setStatusType("info");

    try {
      const hash = await writeContractAsync({
        address: contracts.USDC,
        abi: erc20Abi,
        functionName: "transfer",
        args: [destinationAddress as `0x${string}`, parsedAmount.value],
        chainId: selectedChain,
      });

      setStatus(`Transfer sent! TX: ${hash.slice(0, 10)}...`);
      setStatusType("success");
      setDestinationAddress("");
      setAmount("");
      await refetchBalance();
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Error sending transfer");
      setStatusType("error");
    } finally {
      setSending(false);
    }
  };

  const isFormValid = isAddress(destinationAddress) && parsedAmount.isValid;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Send USDC</CardTitle>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition text-2xl leading-none"
            >
              ✕
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Network Selector */}
          <div>
            <label className="text-xs text-white/70 font-medium block mb-2">
              Send from Network
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    setSelectedChain(chain.id);
                    setStatus("");
                    setAmount("");
                  }}
                  className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                    selectedChain === chain.id
                      ? "border-[#2DD4D4] bg-[#2DD4D4]/10 text-white font-semibold"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                  }`}
                >
                  {chain.shortName}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Available Balance</span>
              <span className="text-sm font-semibold text-[#2DD4D4]">${balance.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/70 font-medium block mb-2">
              Recipient Address
            </label>
            <input
              value={destinationAddress}
              onChange={(e) => {
                setDestinationAddress(e.target.value);
                setStatus("");
              }}
              placeholder="0x..."
              className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/[0.10] text-white placeholder-white/40 focus:outline-none focus:border-[#2DD4D4]/50 transition"
            />
            {destinationAddress && !isAddress(destinationAddress) && (
              <div className="text-xs text-red-400 mt-1">Invalid address format</div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-white/70 font-medium">Amount (USDC)</label>
              <button
                type="button"
                onClick={() => setAmount(balance.toString())}
                className="text-xs text-[#2DD4D4] hover:text-[#7DEAEA] transition"
              >
                Max
              </button>
            </div>
            <input
              value={amount}
              onChange={(e) => {
                setAmount(normalizeDecimalInput(e.target.value));
                setStatus("");
              }}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/[0.10] text-white placeholder-white/40 focus:outline-none focus:border-[#2DD4D4]/50 transition"
            />
            <div className="flex justify-between items-center mt-1 text-xs">
              <span className="text-white/40">Base units</span>
              <span className="font-mono text-white/50">
                {parsedAmount.value?.toString() || "0"}
              </span>
            </div>
          </div>

          {status && (
            <div
              className={`p-3 rounded-lg text-sm ${
                statusType === "success"
                  ? "bg-green-500/10 border border-green-500/30 text-green-300"
                  : statusType === "error"
                  ? "bg-red-500/10 border border-red-500/30 text-red-300"
                  : "bg-blue-500/10 border border-blue-500/30 text-blue-300"
              }`}
            >
              {status}
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={!isFormValid || sending}
            loading={sending}
            fullWidth
          >
            {sending ? "Sending..." : "Send USDC"}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              fullWidth
            >
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
