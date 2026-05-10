// Clean shape used by the UI. Real DB columns are translated by lib/mappers.ts
// at the API boundary so component code never touches the denormalized
// `trades` row directly.

export type Side = "BUY" | "SELL";

export interface Market {
  id: string;              // condition_id
  title: string;
  slug: string | null;
  category: string | null;
}

export interface Wallet {
  wallet: string;          // proxy_wallet (0x… address)
  name: string | null;
  pseudonym: string | null;
}

export interface Trade {
  id: string;              // synthetic: {transactionHash}_{proxyWallet}_{asset}
  ts: number;              // milliseconds since epoch
  side: Side;
  size: number;
  price: number;
  notional: number;
  outcome: string | null;
  outcomeIndex: number | null;
  asset: string;
  transactionHash: string;
  score: number | null;
  notionalScore: number | null;
  counterTrend: boolean;
  market: Market;
  wallet: Wallet;
}

export interface AlertCondition {
  min_score?: number;
  min_notional?: number;
  categories?: string[];
  wallets?: string[];
  markets?: string[];
  counter_trend_only?: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: AlertCondition;
  channel: "discord";
  webhook_url: string | null;
  created_at: string;      // ISO 8601
}

export interface PricePoint {
  ts: number;        // ms epoch
  price: number;
}

export interface TradeDetail {
  trade: Trade;
  sameWallet: Trade[];
  sameMarket: Trade[];
  series: PricePoint[];   // chronological, ts asc
}

// Aggregations for the right-column cards.

export interface TopMarket {
  id: string;                   // condition_id
  title: string;
  category: string | null;
  notional: number;             // sum of notional in window
  tradeCount: number;
  anomalyCount: number;         // trades with score >= 4
  lastPrice: number | null;
}

export interface TopWallet {
  wallet: string;               // proxy_wallet
  name: string | null;
  pseudonym: string | null;
  notional: number;
  tradeCount: number;
  marketCount: number;          // distinct condition_ids touched
  winRate: number | null;       // null in v1 — needs PnL calc
}

// Raw row shapes — what we read from Supabase. Use only inside lib/mappers.ts.

export interface TradeRow {
  id: string;
  timestamp: number;             // BIGINT seconds since epoch
  condition_id: string;
  title: string | null;
  slug: string | null;
  category: string | null;
  proxy_wallet: string;
  asset: string;
  side: string;                  // 'BUY' | 'SELL'
  outcome: string | null;
  outcome_index: number | null;
  size: number | string;         // numeric → may arrive as string
  price: number | string;
  notional: number | string;
  transaction_hash: string;
  name: string | null;
  pseudonym: string | null;
  score: number | string | null;
  notional_score: number | string | null;
  counter_trend: boolean | null;
}

export interface MarketRow {
  id: string;                    // alias for condition_id (view)
  title: string | null;
  slug: string | null;
  category: string | null;
}

export interface WalletRow {
  wallet: string;                // alias for proxy_wallet (view)
  name: string | null;
  pseudonym: string | null;
}
