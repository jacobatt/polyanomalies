// Translation layer between the live (denormalized) `trades` row shape and
// the clean shape components consume. Column-name mapping is documented in
// spec.md § "Real database shape". Numeric columns can arrive as strings
// from PostgREST when they're DB-side `numeric` — cast defensively.

import type {
  Market,
  MarketRow,
  Side,
  Trade,
  TradeRow,
  Wallet,
  WalletRow,
} from "./types";

const num = (v: number | string | null | undefined): number =>
  v == null ? 0 : typeof v === "number" ? v : Number(v);

const numOrNull = (v: number | string | null | undefined): number | null =>
  v == null ? null : typeof v === "number" ? v : Number(v);

export function rowToTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    ts: row.timestamp * 1000,                    // seconds → ms
    side: row.side as Side,
    size: num(row.size),
    price: num(row.price),
    notional: num(row.notional),
    outcome: row.outcome,
    outcomeIndex: row.outcome_index,
    asset: row.asset,
    transactionHash: row.transaction_hash,
    score: numOrNull(row.score),
    notionalScore: numOrNull(row.notional_score),
    counterTrend: row.counter_trend === true,
    market: {
      id: row.condition_id,
      title: row.title ?? "(unknown market)",
      slug: row.slug,
      category: row.category,
    },
    wallet: {
      wallet: row.proxy_wallet,
      name: row.name,
      pseudonym: row.pseudonym,
    },
  };
}

export function rowToMarket(row: MarketRow): Market {
  return {
    id: row.id,
    title: row.title ?? "(unknown market)",
    slug: row.slug,
    category: row.category,
  };
}

export function rowToWallet(row: WalletRow): Wallet {
  return {
    wallet: row.wallet,
    name: row.name,
    pseudonym: row.pseudonym,
  };
}
