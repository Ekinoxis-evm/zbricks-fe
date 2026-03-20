import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/user";

// GET /api/profile?wallet=0x...
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("wallet_address", wallet)
    .single();

  if (error?.code === "PGRST116") return NextResponse.json(null); // not found
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(toProfile(data));
}

// POST /api/profile — upsert profile
export async function POST(req: NextRequest) {
  const body = await req.json() as Omit<UserProfile, "onboardingCompleted" | "createdAt">;

  if (!body.walletAddress) {
    return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
  }

  const row = {
    wallet_address: body.walletAddress.toLowerCase(),
    privy_user_id: body.privyUserId ?? null,
    name: body.name,
    last_name: body.lastName,
    email: body.email,
    phone_country_code: body.phoneCountryCode,
    phone_number: body.phoneNumber,
    expected_investment: body.expectedInvestment,
    onboarding_completed: true,
  };

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .upsert(row, { onConflict: "wallet_address" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toProfile(data));
}

function toProfile(row: Record<string, unknown>): UserProfile {
  return {
    walletAddress: row.wallet_address as string,
    privyUserId: (row.privy_user_id as string) ?? "",
    name: (row.name as string) ?? "",
    lastName: (row.last_name as string) ?? "",
    email: (row.email as string) ?? "",
    phoneCountryCode: (row.phone_country_code as string) ?? "",
    phoneNumber: (row.phone_number as string) ?? "",
    expectedInvestment: (row.expected_investment as string) ?? "",
    onboardingCompleted: (row.onboarding_completed as boolean) ?? false,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}
