"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

const PROTECTED_ROUTES = ["/account", "/biddings", "/admin"];

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030712",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "linear-gradient(135deg, #2DD4D4 0%, #0ea5e9 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 22,
          color: "#0f172a",
        }}
      >
        Z
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#2DD4D4",
              opacity: 0.3,
              animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const walletAddress = user?.wallet?.address;

  const { isOnboarded, isLoading: profileLoading } = useUserProfile(
    authenticated ? walletAddress : undefined
  );

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isOnboardingPage = pathname === "/onboarding";
  const isLandingPage = pathname === "/";

  useEffect(() => {
    if (!ready || profileLoading) return;

    if (authenticated && isOnboarded && isLandingPage) {
      router.push("/auctions");
      return;
    }

    if (authenticated && !isOnboardingPage && !isOnboarded) {
      router.push("/onboarding");
      return;
    }

    if (!authenticated && isProtected) {
      router.push("/");
    }
  }, [ready, authenticated, profileLoading, isOnboarded, pathname, isProtected, isOnboardingPage, isLandingPage, router]);

  // Show branded loading screen instead of blank flash
  if (!ready || (authenticated && profileLoading)) return <LoadingScreen />;

  if (isProtected && (!authenticated || !isOnboarded)) return <LoadingScreen />;

  if (isOnboardingPage && authenticated && isOnboarded) {
    router.push("/auctions");
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
