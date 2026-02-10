import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "placeholder-project-id";

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "ZBrick Auctions",
    }),
    walletConnect({
      projectId,
    }),
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
  ssr: true,
  batch: {
    multicall: true,
  },
});
