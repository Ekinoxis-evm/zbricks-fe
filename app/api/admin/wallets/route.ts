import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminWallet } from "@/lib/admin";

// GET /api/admin/wallets — list all admin wallets
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("admin_wallets")
    .select("id, wallet_address, label, created_at, created_by")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/wallets — add a new admin wallet
export async function POST(req: NextRequest) {
  const { wallet_address, label, created_by } = await req.json();

  if (!wallet_address || !/^0x[0-9a-fA-F]{40}$/.test(wallet_address)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  // Only existing admins (env var or DB) can add new admins
  if (!isAdminWallet(created_by)) {
    // Check DB as fallback
    const { data: dbCheck } = await supabaseAdmin
      .from("admin_wallets")
      .select("id")
      .eq("wallet_address", created_by.toLowerCase())
      .single();
    if (!dbCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("admin_wallets")
    .insert({ wallet_address: wallet_address.toLowerCase(), label: label || null, created_by: created_by?.toLowerCase() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/admin/wallets — remove an admin wallet
export async function DELETE(req: NextRequest) {
  const { wallet_address, requested_by } = await req.json();

  if (!wallet_address) {
    return NextResponse.json({ error: "wallet_address required" }, { status: 400 });
  }

  // Only admins can remove wallets
  const isEnvAdmin = isAdminWallet(requested_by);
  if (!isEnvAdmin) {
    const { data: dbCheck } = await supabaseAdmin
      .from("admin_wallets")
      .select("id")
      .eq("wallet_address", requested_by?.toLowerCase())
      .single();
    if (!dbCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin
    .from("admin_wallets")
    .delete()
    .eq("wallet_address", wallet_address.toLowerCase());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
