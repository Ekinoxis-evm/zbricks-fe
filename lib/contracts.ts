import type { Address } from "viem";
import deployments from "../deploymnets/addresses.json";

// ============ Deployment Configuration ============

// Supported chain IDs (Base Sepolia and Base Mainnet only)
export const SUPPORTED_CHAINS = [84532, 8453] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number];

// Get active chain from environment or default to Base Sepolia
const DEFAULT_CHAIN_ID = 84532;
const ACTIVE_CHAIN_ID = (() => {
  const envChain = process.env.NEXT_PUBLIC_NETWORK;
  if (envChain) {
    const chainId = parseInt(envChain);
    if (SUPPORTED_CHAINS.includes(chainId as SupportedChainId)) {
      return chainId as SupportedChainId;
    }
    console.warn(
      `Invalid NEXT_PUBLIC_NETWORK: ${envChain}. Using default: ${DEFAULT_CHAIN_ID}`
    );
  }
  return DEFAULT_CHAIN_ID;
})();

// Type-safe deployment structure
type DeploymentData = {
  [K in SupportedChainId]: {
    chainId: K;
    chainName: string;
    explorer: string;
    timestamp: string;
    contracts: {
      HouseNFT: Address;
      AuctionFactory: Address;
      AuctionManager: Address;
    };
  };
};

// Validate and type-cast deployments
const typedDeployments = deployments as DeploymentData;

// External configuration from environment
const USDC_ADDRESSES = {
  84532: (process.env.NEXT_PUBLIC_USDC_BASE_SEPOLIA || "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as Address,
  8453: (process.env.NEXT_PUBLIC_USDC_BASE_MAINNET || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as Address,
};

const RPC_URLS = {
  84532: process.env.NEXT_PUBLIC_RPC_BASE_SEPOLIA || "https://sepolia.base.org",
  8453: process.env.NEXT_PUBLIC_RPC_BASE_MAINNET || "https://mainnet.base.org",
};

// Export current active network config
export const ACTIVE_NETWORK = ACTIVE_CHAIN_ID;
export const ACTIVE_DEPLOYMENT = typedDeployments[ACTIVE_CHAIN_ID];

// Export all deployments for multi-chain components
export const ALL_DEPLOYMENTS = typedDeployments;

// Convenience exports for current network
export const CONTRACTS = {
  ...ACTIVE_DEPLOYMENT.contracts,
  USDC: USDC_ADDRESSES[ACTIVE_CHAIN_ID],
};

export const CHAIN_META = {
  chainName: ACTIVE_DEPLOYMENT.chainName,
  explorer: ACTIVE_DEPLOYMENT.explorer,
  rpcDefault: RPC_URLS[ACTIVE_CHAIN_ID],
};

// Helper to get contracts for specific chain (including USDC)
export function getContractsForChain(chainId: SupportedChainId) {
  return {
    ...typedDeployments[chainId].contracts,
    USDC: USDC_ADDRESSES[chainId],
  };
}

// Helper to get chain metadata for specific chain
export function getChainMeta(chainId: SupportedChainId) {
  const deployment = typedDeployments[chainId];
  return {
    chainName: deployment.chainName,
    explorer: deployment.explorer,
    rpcDefault: RPC_URLS[chainId],
  };
}

// ============ ABIs ============
// Import full ABIs directly from deployment artifacts
import AuctionManagerAbi from "../deploymnets/abi/AuctionManager.json";
import HouseNFTAbi from "../deploymnets/abi/HouseNFT.json";
import AuctionFactoryAbi from "../deploymnets/abi/AuctionFactory.json";

// Export full ABIs with proper typing
export const auctionAbi = AuctionManagerAbi as const;
export const houseNftAbi = HouseNFTAbi as const;
export const factoryAbi = AuctionFactoryAbi as const;

// Keep minimal ERC20 ABI for USDC interactions
export const erc20Abi = [
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;
