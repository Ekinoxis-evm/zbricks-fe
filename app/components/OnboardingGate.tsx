"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

const PROTECTED_ROUTES = ["/account", "/biddings", "/admin"];

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

  useEffect(() => {
    if (!ready || profileLoading) return;

    if (authenticated && !isOnboardingPage && !isOnboarded) {
      router.push("/onboarding");
      return;
    }

    if (!authenticated && isProtected) {
      router.push("/auctions");
    }
  }, [ready, authenticated, profileLoading, isOnboarded, pathname, isProtected, isOnboardingPage, router]);

  // Wait for Privy + profile to resolve before rendering anything
  if (!ready || (authenticated && profileLoading)) return null;

  if (isProtected && (!authenticated || !isOnboarded)) return null;

  if (isOnboardingPage && authenticated && isOnboarded) {
    router.push("/auctions");
    return null;
  }

  return <>{children}</>;
}
