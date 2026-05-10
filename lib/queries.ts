// Server-side trade queries shared by RSC pages and the /api/trades route.
// Always filters to scored rows (score IS NOT NULL) — sub-$50k trades are
// "not applicable to whale anomaly detection" per spec.md, not score-zero.

import { serverAnonClient } from "./supabase";
import { rowToTrade } from "./mappers";
import type {
  Trade,
  TradeRow,
  TopMarket,
  TopWallet,
  TradeDetail,
} from "./types";

const ANOMALY_SCORE = 4;
const AGGREGATION_LIMIT = 5000;     // upper bound on rows pulled for top-N rollups

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

/** Internal helper: pull every scored trade in a window for aggregation.
 *  Uses a higher cap than the feed because top-N rollups need full coverage,
 *  not just the most-recent 200. */
async function fetchScoredWindow(since: number): Promise<Trade[]> {
  const sb = serverAnonClient();
  const { data, error } = await sb
    .from("trades")
    .select(
      [
        "id", "timestamp", "condition_id", "title", "slug", "category",
        "proxy_wallet", "asset", "side", "outcome", "outcome_index",
        "size", "price", "notional", "transaction_hash",
        "name", "pseudonym", "score", "notional_score", "counter_trend",
      ].join(","),
    )
    .gte("timestamp", since)
    .not("score", "is", null)
    .order("timestamp", { ascending: false })
    .limit(AGGREGATION_LIMIT);
  if (error) throw new Error(`fetchScoredWindow: ${error.message}`);
  return (data ?? []).map((row) => rowToTrade(row as unknown as TradeRow));
}

/** Top markets in window by total notional, with anomaly count and last
 *  observed price. Aggregates over feed-eligible (scored) trades only. */
export async function fetchTopMarkets(opts: { since: number; limit?: number }): Promise<TopMarket[]> {
  const trades = await fetchScoredWindow(opts.since);
  const byMarket = new Map<string, TopMarket>();
  const lastTsByMarket = new Map<string, number>();
  for (const t of trades) {
    const cur = byMarket.get(t.market.id) ?? {
      id: t.market.id,
      title: t.market.title,
      category: t.market.category,
      notional: 0,
      tradeCount: 0,
      anomalyCount: 0,
      lastPrice: null,
    };
    cur.notional += t.notional;
    cur.tradeCount += 1;
    if ((t.score ?? 0) >= ANOMALY_SCORE) cur.anomalyCount += 1;
    if (t.ts > (lastTsByMarket.get(t.market.id) ?? 0)) {
      lastTsByMarket.set(t.market.id, t.ts);
      cur.lastPrice = t.price;
    }
    byMarket.set(t.market.id, cur);
  }
  return [...byMarket.values()]
    .sort((a, b) => b.notional - a.notional)
    .slice(0, opts.limit ?? 20);
}

/** Top wallets in window by total notional, with trade count and distinct
 *  market count. win_rate is null in v1 — needs PnL calc, deferred. */
export async function fetchTopWallets(opts: { since: number; limit?: number }): Promise<TopWallet[]> {
  const trades = await fetchScoredWindow(opts.since);
  const byWallet = new Map<string, TopWallet>();
  const marketsByWallet = new Map<string, Set<string>>();
  for (const t of trades) {
    const cur = byWallet.get(t.wallet.wallet) ?? {
      wallet: t.wallet.wallet,
      name: t.wallet.name,
      pseudonym: t.wallet.pseudonym,
      notional: 0,
      tradeCount: 0,
      marketCount: 0,
      winRate: null,
    };
    cur.notional += t.notional;
    cur.tradeCount += 1;
    let markets = marketsByWallet.get(t.wallet.wallet);
    if (!markets) {
      markets = new Set<string>();
      marketsByWallet.set(t.wallet.wallet, markets);
    }
    markets.add(t.market.id);
    cur.marketCount = markets.size;
    byWallet.set(t.wallet.wallet, cur);
  }
  return [...byWallet.values()]
    .sort((a, b) => b.notional - a.notional)
    .slice(0, opts.limit ?? 20);
}

/** Single-trade detail for the drawer: focal trade + 6 most-recent scored
 *  trades by the same wallet + 6 most-recent scored trades on the same
 *  market, plus a sparse price series for the mini chart. Returns null
 *  when the focal trade isn't in the table. */
export async function fetchTradeDetail(id: string): Promise<TradeDetail | null> {
  const sb = serverAnonClient();
  const select = [
    "id", "timestamp", "condition_id", "title", "slug", "category",
    "proxy_wallet", "asset", "side", "outcome", "outcome_index",
    "size", "price", "notional", "transaction_hash",
    "name", "pseudonym", "score", "notional_score", "counter_trend",
  ].join(",");

  const { data: row, error } = await sb
    .from("trades")
    .select(select)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`fetchTradeDetail: ${error.message}`);
  if (!row) return null;
  const trade = rowToTrade(row as unknown as TradeRow);

  const [sameWalletRes, sameMarketRes, seriesRes] = await Promise.all([
    sb
      .from("trades")
      .select(select)
      .eq("proxy_wallet", trade.wallet.wallet)
      .neq("id", id)
      .not("score", "is", null)
      .order("timestamp", { ascending: false })
      .limit(6),
    sb
      .from("trades")
      .select(select)
      .eq("condition_id", trade.market.id)
      .neq("id", id)
      .not("score", "is", null)
      .order("timestamp", { ascending: false })
      .limit(6),
    // Series uses *all* trades (not just scored) so the chart isn't sparse.
    sb
      .from("trades")
      .select("timestamp, price")
      .eq("condition_id", trade.market.id)
      .order("timestamp", { ascending: false })
      .limit(80),
  ]);

  const sameWallet = (sameWalletRes.data ?? []).map((r) =>
    rowToTrade(r as unknown as TradeRow),
  );
  const sameMarket = (sameMarketRes.data ?? []).map((r) =>
    rowToTrade(r as unknown as TradeRow),
  );
  const series: TradeDetail["series"] = (seriesRes.data ?? [])
    .map((r: { timestamp: number; price: number | string }) => ({
      ts: Number(r.timestamp) * 1000,
      price: Number(r.price),
    }))
    .reverse();

  return { trade, sameWallet, sameMarket, series };
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
