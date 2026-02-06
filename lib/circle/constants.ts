export type SupportedChainKey = "arc-testnet" | "base-sepolia" | "eth-sepolia";

export const GATEWAY_WALLET_ADDRESS = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
export const GATEWAY_MINTER_ADDRESS = "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CHAINS: Record<
  SupportedChainKey,
  {
    label: string;
    domainId: number;
    usdcAddress: string;
  }
> = {
  "arc-testnet": {
    label: "Arc Testnet",
    domainId: 26,
    usdcAddress: "0x3600000000000000000000000000000000000000",
  },
  "base-sepolia": {
    label: "Base Sepolia",
    domainId: 6,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  "eth-sepolia": {
    label: "Ethereum Sepolia",
    domainId: 0,
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
};

export const SUPPORTED_CHAIN_KEYS = Object.keys(CHAINS) as SupportedChainKey[];

export const mapWalletBlockchainToChainKey = (
  blockchain: string,
): SupportedChainKey | null => {
  const normalized = blockchain.trim().toUpperCase();
  if (normalized.includes("ARC")) {
    return "arc-testnet";
  }
  if (normalized.includes("BASE") && normalized.includes("SEPOLIA")) {
    return "base-sepolia";
  }
  if (normalized.includes("ETH") && normalized.includes("SEPOLIA")) {
    return "eth-sepolia";
  }
  return null;
};
