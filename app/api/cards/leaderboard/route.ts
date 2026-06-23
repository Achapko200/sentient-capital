import { NextResponse }             from "next/server";
import { createPublicClient, http } from "viem";
import { mainnet }                  from "viem/chains";

const client = createPublicClient({
  chain:     mainnet,
  transport: http("https://cloudflare-eth.com"),
});

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { addresses } = body as { addresses?: unknown };

  // Validate — must be an array of valid Ethereum addresses, max 20
  if (!Array.isArray(addresses)) {
    return NextResponse.json({ error: "addresses must be an array" }, { status: 400 });
  }

  if (addresses.length > 20) {
    return NextResponse.json({ error: "Max 20 addresses per request" }, { status: 400 });
  }

  const validAddresses = addresses.filter(
    (a): a is string => typeof a === "string" && WALLET_REGEX.test(a)
  );

  const names: Record<string, string> = {};

  await Promise.all(
    validAddresses.map(async (address) => {
      try {
        const name = await client.getEnsName({
          address: address as `0x${string}`,
        });
        if (name) names[address] = name;
      } catch {
        // no ENS name — leave blank
      }
    })
  );

  return NextResponse.json({ names });
}