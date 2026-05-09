# Spec

## What we're building
A read-only public dashboard that surfaces anomalous trades on Polymarket in real time. Replaces an existing Streamlit dashboard. Data is in Supabase, populated by an existing cron-driven Python ingest job.

## Architecture

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Hosting | Vercel |
| Database | Supabase (existing) |
| Realtime | Supabase Realtime channel on `trades` insert |
| Score logic | Stays in Python (`score.py`) — but **must be persisted** at ingest time (see `migration.md`) |
| Ingest | Existing cron stays — with two additions: persist score columns, drop the inline Discord webhook |
| Auth | None |
| Alerts | Discord webhook only, driven by a new Vercel cron worker |

## Real database shape

**Important.** The current `trades` table is denormalized — there is no `markets` table and no `wallets` table. The prototype mocked a clean shape; reality is flatter:

```
trades:
  id, timestamp, condition_id, title, slug,
  proxy_wallet, asset, side, outcome, outcome_index,
  size, price, transaction_hash,
  name, pseudonym, notional
  -- score, notional_score, counter_trend  ← TO BE ADDED (see migration.md)
  -- category                                ← TO BE ADDED (see migration.md)
```

The migration step adds the score columns, a category column, and creates two **Postgres views** that give the API the clean shape the prototype assumes:

```sql
CREATE VIEW markets AS
  SELECT DISTINCT ON (condition_id)
    condition_id AS id, title, slug, category
  FROM trades
  ORDER BY condition_id, timestamp DESC;

CREATE VIEW wallets AS
  SELECT DISTINCT ON (proxy_wallet)
    proxy_wallet AS wallet, name, pseudonym
  FROM trades
  ORDER BY proxy_wallet, timestamp DESC;
```

The frontend queries `trades` directly for trade data and `markets` / `wallets` (the views) for entity lookups. The frontend does not need to know the views are derived.

**Column-name mapping** the API layer normalizes:
| Spec / UI name | Real column |
|---|---|
| `ts` | `timestamp` |
| `market_id` | `condition_id` |
| `wallet` | `proxy_wallet` |
| `market.title` | `title` (on `trades` directly) |
| `market.category` | `category` (added by migration; enriched at ingest) |
| `wallet.pseudonym` | `pseudonym` |
| `wallet.name` | `name` |

Define these once in `lib/types.ts` and map at the API boundary so component code works in clean names.

## Pages

| Route | Purpose | Prototype reference |
|---|---|---|
| `/` | Main dashboard — KPIs, live feed, threshold control, top markets, top wallets | `PolyAnomalies.html` → artboard `desk` |
| `/markets/[id]` | Per-market detail — price chart with anomaly dots, recent trades | artboard `market-detail` |
| `/wallets/[address]` | Wallet profile — PnL curve, exposure, history | artboard `wallet-profile` |
| `/alerts` | Alert rule configuration + live preview | artboard `alert-config` |

A trade-detail **drawer** (artboard `trade-drawer`) opens over any list view via parallel route — URLs like `/?trade=:id`.

## API routes

```
GET /api/trades?since=ISO&min_score=N&category=X&q=text&limit=60
  → Trade[] with embedded {market, wallet}, ordered by timestamp desc

GET /api/trades/[id]
  → Trade + 6 same-wallet recent + 6 same-market recent

GET /api/markets/top?since=ISO&limit=20
  SELECT condition_id AS id, title, category,
         SUM(notional) AS notional_24h,
         COUNT(*) FILTER (WHERE score >= 4) AS anomaly_count,
         (array_agg(price ORDER BY timestamp DESC))[1] AS last_price
  FROM trades WHERE timestamp >= $since GROUP BY condition_id, title, category
  ORDER BY notional_24h DESC LIMIT $limit;

GET /api/markets/[id]?window=24h|7d|30d
  → { market, series: [{ts, price}], trades: Trade[] }

GET /api/wallets/top?since=ISO&limit=20
  SELECT proxy_wallet, name, pseudonym,
         SUM(notional), COUNT(*),
         /* win_rate left null for v1 — needs PnL calc, defer */
  FROM trades WHERE timestamp >= $since GROUP BY proxy_wallet, name, pseudonym
  ORDER BY SUM(notional) DESC LIMIT $limit;

GET /api/wallets/[address]
  → { wallet, pnl_series, exposure, trades }

POST /api/alerts/preview  body: AlertRule  → { matches_24h, sample }
GET  /api/alerts          → list of saved rules
POST /api/alerts          → save rule (sends test webhook)
DELETE /api/alerts/[id]
GET  /api/alerts/run      → cron entry — evaluates rules, posts to Discord (see migration.md § "Alert worker")
```

All routes server-rendered or RSC-fetched. Use `cache: 'no-store'` on the dashboard.

## Realtime

The dashboard subscribes to `trades` inserts via Supabase Realtime. Incoming rows pass through the same client-side filter as historical ones. New rows animate in (`pa-row-in` keyframe in prototype). Cap the in-memory feed at 200 rows.

```ts
supabase
  .channel('trades-insert')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trades' }, (payload) => { ... })
  .subscribe();
```

**Realtime is off by default in Supabase.** Enable replication on `public.trades` before testing — see `migration.md` § "Supabase setup".

## Score (read-only on the frontend)
After the migration, `trades.score`, `trades.notional_score`, `trades.counter_trend` are populated at ingest time by `ingest.py` calling into `score.py`. The frontend just reads those columns. Do not recompute on the client.

## Filtering rules (client-side)
- Score threshold: slider 0–6 in 0.25 steps
- Category: multi-select chips. Source list comes from `SELECT DISTINCT category FROM trades WHERE category IS NOT NULL`. Until the ingest enrichment lands, the chip rail is hidden behind a `hasCategoriesData` check.
- Search: substring match against `title` + `pseudonym`
- Time window: 6h / 24h / 72h / 7d (server-side via `since` param)

## Empty / loading / error states
Every list view implements all four states from the `states` artboard.

## Mobile
Single breakpoint at `md:` (768px). Below: tabs + horizontally-scrolling KPIs + single-column feed. Above: full desktop grid.

## Out of scope
Auth, watchlists, multiple alert channels, score-formula changes, mobile native app, win-rate calculation.
