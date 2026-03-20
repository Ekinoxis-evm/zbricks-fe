// app/api/endpoints/route.ts
// Circle API proxy has been removed - all wallet operations are now handled
// client-side via the Base Account SDK (wallet_sendCalls).
// This route is kept as a minimal health-check endpoint.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      provider: "base-account-sdk",
    },
    { status: 200 },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint no longer proxies Circle API calls. All wallet operations use the Base Account SDK client-side.",
    },
    { status: 410 },
  );
}
