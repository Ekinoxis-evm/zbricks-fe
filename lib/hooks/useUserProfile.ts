import { useState, useEffect, useCallback } from "react";
import type { UserProfile } from "@/types/user";

const CACHE_KEY = "zbricks_profile";

function readCache(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? (JSON.parse(stored) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeCache(profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
}

function clearCache() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}

export function useUserProfile(walletAddress?: string) {
  // Start with localStorage cache for instant, flash-free reads
  const [profile, setProfile] = useState<UserProfile | null>(readCache);
  const [isLoading, setIsLoading] = useState(!!walletAddress);

  useEffect(() => {
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }

    // If cache matches the current wallet, skip the initial loading state
    const cached = readCache();
    if (cached?.walletAddress?.toLowerCase() === walletAddress.toLowerCase()) {
      setProfile(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/profile?wallet=${walletAddress}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: UserProfile | null) => {
        if (data) {
          setProfile(data);
          writeCache(data);
        } else {
          // Wallet has no profile yet — clear stale cache
          setProfile(null);
          clearCache();
        }
      })
      .catch(() => {
        // Network error — keep cache
      })
      .finally(() => setIsLoading(false));
  }, [walletAddress]);

  const saveProfile = useCallback(
    async (data: Omit<UserProfile, "onboardingCompleted" | "createdAt">): Promise<UserProfile> => {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      const saved: UserProfile = await res.json();
      setProfile(saved);
      writeCache(saved);
      return saved;
    },
    []
  );

  const clearProfile = useCallback(() => {
    setProfile(null);
    clearCache();
  }, []);

  const isOnboarded = profile?.onboardingCompleted === true;

  return { profile, isLoading, isOnboarded, saveProfile, clearProfile };
}
