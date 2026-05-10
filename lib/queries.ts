// Server-side trade queries shared by RSC pages and the /api/trades route.
// Always filters to scored rows (score IS NOT NULL) — sub-$50k trades are
// "not applicable to whale anomaly detection" per spec.md, not score-zero.

import { serverAnonClient } from "./supabase";
import { rowToTrade } from "./mappers";
import type { Trade, TradeRow } from "./types";

const TRADE_COLS = [
  "id", "timestamp", "condition_id", "title", "slug", "category",
  "proxy_wallet", "asset", "side", "outcome", "outcome_index",
  "size", "price", "notional", "transaction_hash",
  "name", "pseudonym", "score", "notional_score", "counter_trend",
].join(",");

export interface TradeQuery {
  /** Unix seconds — return trades with `timestamp >= since`. */
  since: number;
  /** Tighten to score >= this. Default: any non-null score. */
  minScore?: number;
  /** Match any of these. Empty array == no filter. */
  categories?: string[];
  /** Substring on title or pseudonym (ILIKE). */
  q?: string;
  /** Default 200 (matches feed cap), max 500. */
  limit?: number;
}

export async function fetchTrades(opts: TradeQuery): Promise<Trade[]> {
  const limit = Math.min(500, Math.max(1, opts.limit ?? 200));
  const sb = serverAnonClient();

  let query = sb
    .from("trades")
    .select(TRADE_COLS)
    .gte("timestamp", opts.since)
    .not("score", "is", null)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (opts.minScore != null) {
    query = query.gte("score", opts.minScore);
  }

  const cats = opts.categories?.filter(Boolean) ?? [];
  if (cats.length === 1) query = query.eq("category", cats[0]);
  else if (cats.length > 1) query = query.in("category", cats);

  if (opts.q) {
    // Escape PostgREST wildcards. The * is the wildcard inside or().
    const safe = opts.q.replace(/[*%_,()]/g, " ").trim();
    if (safe) {
      query = query.or(`title.ilike.*${safe}*,pseudonym.ilike.*${safe}*`);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(`fetchTrades: ${error.message}`);
  return (data ?? []).map((row) => rowToTrade(row as unknown as TradeRow));
}

/** Distinct non-null categories, sourced from the `markets` view (one row
 *  per condition_id, so the list reflects all markets, not just the recent
 *  trade window). Returns sorted asc. Empty until the cron has tagged any
 *  market via Gamma. */
export async function fetchCategories(): Promise<string[]> {
  const sb = serverAnonClient();
  const { data, error } = await sb
    .from("markets")
    .select("category")
    .not("category", "is", null);
  if (error) return [];
  return [...new Set((data ?? []).map((r: { category: string | null }) => r.category as string))]
    .filter(Boolean)
    .sort();
}

/** Parse `since` from a query string. Accepts `6h` / `24h` / `7d` shorthand
 *  or any Date.parse-able ISO string. Defaults to 24h ago. */
export function parseSince(raw: string | null | undefined): number {
  const now = Date.now();
  if (raw) {
    const m = /^(\d+)\s*([hd])$/i.exec(raw);
    if (m) {
      const n = parseInt(m[1], 10);
      const mult = m[2].toLowerCase() === "h" ? 3600 : 86400;
      return Math.floor(now / 1000) - n * mult;
    }
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) return Math.floor(t / 1000);
  }
  return Math.floor((now - 24 * 3600 * 1000) / 1000);
}

export interface KpiSummary {
  notional: number;       // sum of notional in window
  anomalies: number;      // count of feed-eligible trades returned
  whales: number;         // count with notional >= $1M
  counterTrend: number;   // count with counter_trend = true
  markets: number;        // distinct condition_id count
}

export function summarize(trades: Trade[]): KpiSummary {
  let notional = 0;
  let whales = 0;
  let counterTrend = 0;
  const markets = new Set<string>();
  for (const t of trades) {
    notional += t.notional;
    if (t.notional >= 1_000_000) whales += 1;
    if (t.counterTrend) counterTrend += 1;
    markets.add(t.market.id);
  }
  return {
    notional,
    anomalies: trades.length,
    whales,
    counterTrend,
    markets: markets.size,
  };
}
