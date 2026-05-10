import { NextResponse } from "next/server";
import { fetchTrades, tradeMatchesRule } from "@/lib/queries";
import type { AlertCondition } from "@/lib/types";

export const dynamic = "force-dynamic";

const SAMPLE_LIMIT = 5;

export async function POST(req: Request) {
  let body: { conditions?: AlertCondition };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const conditions = body.conditions ?? {};
  // Last 24h, scored only — same shape the cron will see for live evals.
  const since = Math.floor((Date.now() - 24 * 3600 * 1000) / 1000);
  const trades = await fetchTrades({ since, limit: 500 });
  const matches = trades.filter((t) => tradeMatchesRule(t, conditions));
  return NextResponse.json({
    matches_24h: matches.length,
    sample: matches.slice(0, SAMPLE_LIMIT),
  });
}
