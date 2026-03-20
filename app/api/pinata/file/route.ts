import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(request: Request) {
  try {
    if (!PINATA_JWT) {
      return NextResponse.json(
        { error: "Missing PINATA_JWT in server env" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const name = (formData.get("name") as string) || (file instanceof File ? file.name : "upload");

    const pinataForm = new FormData();
    pinataForm.append("file", file, name);
    pinataForm.append(
      "pinataMetadata",
      JSON.stringify({ name }),
    );

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: pinataForm,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(
      {
        cid: data.IpfsHash,
        ipfsUrl: `ipfs://${data.IpfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
