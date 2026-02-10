import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, base } from "wagmi/chains";
import { http } from "wagmi";

// Ensure we have a project ID - use a placeholder if not set
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "placeholder-project-id";

export const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || "ZBrick Auctions",
  projectId,
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 
      process.env.NEXT_PUBLIC_RPC_BASE_SEPOLIA || 
      "https://sepolia.base.org"
    ),
    [base.id]: http(
      process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || 
      process.env.NEXT_PUBLIC_RPC_BASE_MAINNET || 
      "https://mainnet.base.org"
    ),
  },
  ssr: true,
});
