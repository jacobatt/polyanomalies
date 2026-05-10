import { NextResponse } from "next/server";
import { fetchTopMarkets, parseSince } from "@/lib/queries";

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
    const markets = await fetchTopMarkets({ since, limit });
    return NextResponse.json({ markets });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
