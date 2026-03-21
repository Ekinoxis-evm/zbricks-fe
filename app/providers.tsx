"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { config, activeChain } from "@/lib/wagmi-config";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import OnboardingGate from "@/app/components/OnboardingGate";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const isPrivyConfigured = Boolean(PRIVY_APP_ID) && !PRIVY_APP_ID.startsWith("clxx-replace");

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // Without a valid Privy App ID the app is unconfigured — render a setup notice
  if (!isPrivyConfigured) {
    return (
      <ErrorBoundary>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "white",
          flexDirection: "column",
          gap: 16,
          fontFamily: "system-ui",
          textAlign: "center",
          padding: 24,
        }}>
          <div style={{ fontSize: 32 }}>⚙️</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>ZBricks setup required</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, maxWidth: 400 }}>
            Add your <code style={{ color: "#67e8f9" }}>NEXT_PUBLIC_PRIVY_APP_ID</code> to{" "}
            <code style={{ color: "#67e8f9" }}>.env.local</code> to get started.
            <br /><br />
            Get your App ID at{" "}
            <a href="https://dashboard.privy.io" target="_blank" rel="noreferrer"
              style={{ color: "#2DD4D4" }}>dashboard.privy.io</a>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          loginMethods: ["email", "google", "wallet"],
          appearance: {
            theme: "dark",
            accentColor: "#2DD4D4",
            landingHeader: "Accede a ZBricks",
            logo: "https://zbricks.app/zbricks.png",
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          defaultChain: activeChain,
          supportedChains: [activeChain],
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <OnboardingGate>{children}</OnboardingGate>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ErrorBoundary>
  );
}
