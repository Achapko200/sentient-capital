import { NextResponse }        from "next/server";
import { createPublicClient, http } from "viem";
import { mainnet }             from "viem/chains";
 
const client = createPublicClient({
  chain:     mainnet,
  transport: http("https://cloudflare-eth.com"),
});
 
export async function POST(req: Request) {
  const { addresses } = await req.json() as { addresses: string[] };
 
  const names: Record<string, string> = {};
 
  await Promise.all(
    addresses.map(async (address) => {
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
 