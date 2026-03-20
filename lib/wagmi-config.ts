import { createConfig } from "@privy-io/wagmi";
import { base, baseSepolia } from "viem/chains";
import { http } from "wagmi";

const isMainnet = process.env.NEXT_PUBLIC_NETWORK === "mainnet";

export const activeChain = isMainnet ? base : baseSepolia;

export const config = isMainnet
  ? createConfig({
      chains: [base],
      transports: {
        [base.id]: http(
          process.env.NEXT_PUBLIC_RPC_BASE_MAINNET || "https://mainnet.base.org"
        ),
      },
    })
  : createConfig({
      chains: [baseSepolia],
      transports: {
        [baseSepolia.id]: http(
          process.env.NEXT_PUBLIC_RPC_BASE_SEPOLIA || "https://sepolia.base.org"
        ),
      },
    });
