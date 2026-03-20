import type { UserProfile } from "@/types/user";

const STORAGE_KEY = "zbricks_profile";

export function useUserProfile() {
  function getProfile(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as UserProfile;
    } catch {
      return null;
    }
  }

  function saveProfile(data: Omit<UserProfile, "onboardingCompleted" | "createdAt">): UserProfile {
    const profile: UserProfile = {
      ...data,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  }

  function isOnboarded(): boolean {
    const profile = getProfile();
    return profile?.onboardingCompleted === true;
  }

  function clearProfile(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { getProfile, saveProfile, isOnboarded, clearProfile };
}
