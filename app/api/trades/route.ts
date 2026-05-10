import { NextResponse } from "next/server";
import { fetchTrades, parseSince } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const since = parseSince(sp.get("since"));
  const minScoreRaw = sp.get("min_score");
  const minScore =
    minScoreRaw != null && !Number.isNaN(parseFloat(minScoreRaw))
      ? parseFloat(minScoreRaw)
      : undefined;

  // Accept either `categories=A,B` (canonical) or `category=A` (singular).
  const catsRaw = sp.get("categories") ?? sp.get("category") ?? "";
  const categories = catsRaw
    ? catsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const q = sp.get("q") ?? undefined;
  const limitRaw = sp.get("limit");
  const limit =
    limitRaw != null && !Number.isNaN(parseInt(limitRaw, 10))
      ? parseInt(limitRaw, 10)
      : undefined;

  try {
    const trades = await fetchTrades({ since, minScore, categories, q, limit });
    return NextResponse.json({ trades });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
