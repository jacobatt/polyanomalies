import { NextResponse } from "next/server";
import { fetchTopWallets, parseSince } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const since = parseSince(sp.get("since"));
  const limitRaw = sp.get("limit");
  const limit =
    limitRaw != null && !Number.isNaN(parseInt(limitRaw, 10))
      ? parseInt(limitRaw, 10)
      : undefined;
  try {
    const wallets = await fetchTopWallets({ since, limit });
    return NextResponse.json({ wallets });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
