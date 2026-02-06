// app/api/endpoints/route.ts
import { NextResponse } from "next/server";

const CIRCLE_BASE_URL =
  process.env.NEXT_PUBLIC_CIRCLE_BASE_URL ?? "https://api.circle.com";
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY as string;
const GATEWAY_BASE_URL =
  process.env.CIRCLE_GATEWAY_BASE_URL ?? "https://gateway-api-testnet.circle.com";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      hasApiKey: Boolean(CIRCLE_API_KEY),
      baseUrl: CIRCLE_BASE_URL,
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  try {
    if (!CIRCLE_API_KEY) {
      return NextResponse.json(
        { error: "Missing CIRCLE_API_KEY in server env" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { action, ...params } = body ?? {};

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    switch (action) {
      case "requestEmailOtp": {
        const { deviceId, email } = params;
        if (!deviceId || !email) {
          return NextResponse.json(
            { error: "Missing deviceId or email" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/users/email/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              deviceId,
              email,
            }),
          },
        );

        const data = await response.json();
        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // { deviceToken, deviceEncryptionKey, otpToken }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "requestSocialToken": {
        const { deviceId } = params;
        if (!deviceId) {
          return NextResponse.json(
            { error: "Missing deviceId" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/users/social/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              deviceId,
            }),
          },
        );

        const data = await response.json();
        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // { deviceToken, deviceEncryptionKey }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "verifyEmailOtp": {
        return NextResponse.json(
          {
            error:
              "Email OTP verification is handled by the Circle Web SDK (verifyOtp).",
          },
          { status: 400 },
        );
      }

      case "initializeUser": {
        const { userToken, blockchains, accountType } = params;
        if (!userToken) {
          return NextResponse.json(
            { error: "Missing userToken" },
            { status: 400 },
          );
        }

        const chainList = Array.isArray(blockchains) && blockchains.length > 0
          ? blockchains
          : ["ARC-TESTNET"];

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/user/initialize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              accountType: accountType ?? "SCA",
              blockchains: chainList,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          // e.g. 155106 user already initialized
          return NextResponse.json(data, { status: response.status });
        }

        // { challengeId }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "createUserWallets": {
        const { userToken, blockchains, accountType, metadata } = params;
        if (!userToken) {
          return NextResponse.json(
            { error: "Missing userToken" },
            { status: 400 },
          );
        }
        if (!Array.isArray(blockchains) || blockchains.length === 0) {
          return NextResponse.json(
            { error: "Missing blockchains" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/user/wallets`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              accountType: accountType ?? "SCA",
              blockchains,
              metadata,
            }),
          },
        );

        const data = await response.json();
        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data.data, { status: 200 });
      }

      case "listWallets": {
        const { userToken } = params;
        if (!userToken) {
          return NextResponse.json(
            { error: "Missing userToken" },
            { status: 400 },
          );
        }

        const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/wallets`, {
          method: "GET",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: `Bearer ${CIRCLE_API_KEY}`,
            "X-User-Token": userToken,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // { wallets: [...] }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "getTokenBalance": {
        const { userToken, walletId } = params;
        if (!userToken || !walletId) {
          return NextResponse.json(
            { error: "Missing userToken or walletId" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/wallets/${walletId}/balances`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // { tokenBalances: [...] }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "createTransferChallenge": {
        const {
          userToken,
          walletId,
          destinationAddress,
          amounts,
          tokenId,
          tokenAddress,
          blockchain,
          feeLevel,
        } = params;

        if (!userToken || !walletId || !destinationAddress) {
          return NextResponse.json(
            { error: "Missing userToken, walletId, or destinationAddress" },
            { status: 400 },
          );
        }

        if (!amounts || !Array.isArray(amounts) || amounts.length === 0) {
          return NextResponse.json(
            { error: "Missing amounts" },
            { status: 400 },
          );
        }

        const body: Record<string, unknown> = {
          idempotencyKey: crypto.randomUUID(),
          walletId,
          destinationAddress,
          amounts,
          feeLevel: feeLevel ?? "MEDIUM",
        };

        if (tokenId) {
          body.tokenId = tokenId;
        } else if (tokenAddress && blockchain) {
          body.tokenAddress = tokenAddress;
          body.blockchain = blockchain;
        } else {
          return NextResponse.json(
            { error: "Missing tokenId or tokenAddress+blockchain" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/user/transactions/transfer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
            body: JSON.stringify(body),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data.data, { status: 200 });
      }

      case "createContractExecutionChallenge": {
        const {
          userToken,
          walletId,
          contractAddress,
          abiFunctionSignature,
          abiParameters,
          callData,
          feeLevel,
        } = params;

        if (!userToken || !walletId || !contractAddress) {
          return NextResponse.json(
            { error: "Missing userToken, walletId, or contractAddress" },
            { status: 400 },
          );
        }

        if (!abiFunctionSignature && !callData) {
          return NextResponse.json(
            { error: "Missing abiFunctionSignature or callData" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/user/transactions/contractExecution`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              walletId,
              contractAddress,
              abiFunctionSignature,
              abiParameters,
              callData,
              feeLevel,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data.data, { status: 200 });
      }

      case "signTypedDataChallenge": {
        const { userToken, walletId, data, memo } = params;

        if (!userToken || !walletId || !data) {
          return NextResponse.json(
            { error: "Missing userToken, walletId, or data" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/user/sign/typedData`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              walletId,
              data,
              memo,
            }),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          return NextResponse.json(result, { status: response.status });
        }

        return NextResponse.json(result.data, { status: 200 });
      }

      case "gatewayTransfer": {
        const { burnIntents, requests } = params;

        const input = Array.isArray(burnIntents) ? burnIntents : requests;

        if (!Array.isArray(input)) {
          return NextResponse.json(
            { error: "Missing burn intents array" },
            { status: 400 },
          );
        }

        const payload = input.map((item) => ({
          burnIntent: item?.burnIntent ?? item?.intent,
          signature: item?.signature,
        }));

        const response = await fetch(`${GATEWAY_BASE_URL}/v1/transfer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });
      }

      case "gatewayBalances": {
        const { depositor, domains, token } = params;

        if (!depositor) {
          return NextResponse.json(
            { error: "Missing depositor" },
            { status: 400 },
          );
        }

        const sources =
          Array.isArray(domains) && domains.length > 0
            ? domains.map((domain: number) => ({
                depositor,
                domain,
              }))
            : [
                {
                  depositor,
                },
              ];

        const response = await fetch(`${GATEWAY_BASE_URL}/v1/balances`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token ?? "USDC",
            sources,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in /api/endpoints:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
