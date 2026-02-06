import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PINATA_JWT = process.env.PINATA_JWT;

type PinataRequest = {
  content: unknown;
  name?: string;
  keyvalues?: Record<string, string | number>;
};

export async function POST(request: Request) {
  try {
    if (!PINATA_JWT) {
      return NextResponse.json(
        { error: "Missing PINATA_JWT in server env" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as PinataRequest;
    if (!body?.content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      pinataContent: body.content,
    };

    if (body.name || body.keyvalues) {
      payload.pinataMetadata = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.keyvalues ? { keyvalues: body.keyvalues } : {}),
      };
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(
      {
        cid: data.IpfsHash,
        ipfsUrl: `ipfs://${data.IpfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
        pinata: data,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
