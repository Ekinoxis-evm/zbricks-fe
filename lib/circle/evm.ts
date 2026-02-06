export type Hex = `0x${string}`;
export type Address = Hex;

export const MAX_UINT256 = BigInt(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);

export const isAddress = (value: string): value is Address =>
  /^0x[a-fA-F0-9]{40}$/.test(value);

export const toHex = (bytes: Uint8Array): Hex => {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}`;
};

export const padHex = (value: string, size: number): Hex => {
  const clean = value.startsWith("0x") ? value.slice(2) : value;
  const padded = clean.padStart(size * 2, "0");
  return `0x${padded}` as Hex;
};

export const parseUnits = (value: string, decimals: number): bigint => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Invalid amount");
  }

  if (!/^[0-9]*\\.?[0-9]*$/.test(normalized)) {
    throw new Error("Invalid amount");
  }

  const [whole = "0", fraction = ""] = normalized.split(".");

  if (fraction.length > decimals) {
    throw new Error("Too many decimal places");
  }

  const paddedFraction = fraction.padEnd(decimals, "0");
  const combined = `${whole}${paddedFraction}`.replace(/^0+(?=\\d)/, "");
  return BigInt(combined || "0");
};

export const formatUnits = (value: bigint, decimals: number): string => {
  const negative = value < 0n;
  const absValue = negative ? -value : value;
  const raw = absValue.toString().padStart(decimals + 1, "0");
  const whole = raw.slice(0, -decimals) || "0";
  const fraction = raw.slice(-decimals).replace(/0+$/, "");
  const formatted = fraction ? `${whole}.${fraction}` : whole;
  return negative ? `-${formatted}` : formatted;
};
