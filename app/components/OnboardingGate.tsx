"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

// Routes that require authentication + completed onboarding
const PROTECTED_ROUTES = ["/account", "/biddings", "/admin"];

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const { isOnboarded } = useUserProfile();

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isOnboardingPage = pathname === "/onboarding";

  useEffect(() => {
    if (!ready) return;

    // Redirect authenticated users who haven't onboarded yet
    if (authenticated && !isOnboardingPage && !isOnboarded()) {
      router.push("/onboarding");
      return;
    }

    // Redirect unauthenticated users away from protected routes
    if (!authenticated && isProtected) {
      router.push("/auctions");
    }
  }, [ready, authenticated, pathname, isProtected, isOnboardingPage, router, isOnboarded]);

  // Show nothing while deciding (avoids flash)
  if (!ready) return null;

  // Block render of protected pages until auth + onboarding confirmed
  if (isProtected && (!authenticated || !isOnboarded())) return null;

  // Block onboarding page from showing to already-onboarded users
  if (isOnboardingPage && authenticated && isOnboarded()) {
    router.push("/auctions");
    return null;
  }

  return <>{children}</>;
}
