# Migration

You're moving from a Streamlit app to Next.js, sharing the same Supabase database. The DB needs a few additions before the new app can read it cleanly.

## What stays
- **Supabase project** — same URL, same anon key.
- **`score.py`** — formula stays exactly as-is. We're changing **when** it runs (now at ingest, not at read), not what it computes.
- **`ingest.py`** — keeps fetching from Polymarket on cron. Two small changes below.
- **The cron host** — wherever it runs, leave it.

## What gets deleted
- `streamlit_app.py` and any Streamlit-specific helpers
- `streamlit*` from `requirements.txt`
- The Streamlit Cloud deployment

Keep `score.py`, `ingest.py`, and shared Python utilities. Move them into a `python/` subfolder of the new repo, or leave them where they are.

## Prerequisites (do these first)
1. **Vercel account** — sign up if needed, install GitHub app on the org.
2. **New GitHub repo** — empty, named `polyanomalies`.
3. **Enable Supabase Realtime on `trades`** — Dashboard → Database → Replication → toggle `public.trades` on. Off by default; the live feed won't work without this.
4. **Supabase RLS** — confirm `SELECT` is allowed for `anon` on `trades` (and the new views below). The Streamlit app may have used the service role; the new browser app uses the anon key.

## DB migrations

Run these SQL statements in the Supabase SQL editor, in order.

### 1. Add the missing columns to `trades`

```sql
ALTER TABLE trades
  ADD COLUMN score          numeric,
  ADD COLUMN notional_score numeric,
  ADD COLUMN counter_trend  boolean DEFAULT false,
  ADD COLUMN category       text;

CREATE INDEX trades_score_idx     ON trades (score)     WHERE score IS NOT NULL;
CREATE INDEX trades_timestamp_idx ON trades (timestamp DESC);
CREATE INDEX trades_condition_idx ON trades (condition_id);
CREATE INDEX trades_wallet_idx    ON trades (proxy_wallet);
```

### 2. Create the views the API expects

```sql
CREATE VIEW markets AS
  SELECT DISTINCT ON (condition_id)
    condition_id AS id,
    title, slug, category
  FROM trades
  ORDER BY condition_id, timestamp DESC;

CREATE VIEW wallets AS
  SELECT DISTINCT ON (proxy_wallet)
    proxy_wallet AS wallet,
    name,
    pseudonym
  FROM trades
  ORDER BY proxy_wallet, timestamp DESC;
```

### 3. Add the alert-rules + cron-state tables

```sql
CREATE TABLE alert_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  conditions  jsonb NOT NULL,             -- { min_score, min_notional, categories, wallets, markets, counter_trend_only }
  channel     text NOT NULL DEFAULT 'discord',
  webhook_url text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cron_state (
  key   text PRIMARY KEY,
  value timestamptz NOT NULL
);
INSERT INTO cron_state (key, value) VALUES ('alerts_last_run', now());
```

### 4. Backfill score for existing rows (one-off)

After updating `ingest.py` (next section), run `backfill_scores.py` once. It calls `score.score_recent(hours=LOOKBACK_DAYS*24)` (which loads >= $50k trades from the last 30 days) and bulk-UPDATEs `score`, `notional_score`, `counter_trend` by id.

Sub-$50k rows stay NULL — the column is intentionally nullable, the partial index `WHERE score IS NOT NULL` only covers scoreable rows, and SQL three-valued logic excludes NULL rows from `score >= N` filters automatically.

If the table has rows older than 30 days that need scores, replace `score_recent` with `score_window(0)` for that one run.

## `ingest.py` changes

Two changes — both contained, no new dependencies.

### Change 1: persist score at insert time

`score.py` is batch-oriented — its counter-trend signal needs a per-market 1h
context window, so per-row scoring isn't possible without re-deriving from
surrounding trades. The resolved approach: add a new `score_window(since_ts)`
entry point alongside the existing `score_recent`, and have ingest call it
after each upsert page. The math is unchanged — `score_window` just shapes
the load + return for incremental scoring.

```python
import score                          # existing module

new_trades = upsert(conn, trades)     # returns the dicts that actually inserted
if new_trades:
    new_ids = {make_id(t) for t in new_trades}
    min_ts  = min(int(t["timestamp"]) for t in new_trades)
    scored  = score.score_window(min_ts)
    scored  = scored[scored["id"].isin(new_ids)]   # write only to new rows
    # bulk UPDATE trades SET score, notional_score, counter_trend WHERE id = ...
```

### Change 2: enrich category from Gamma API

When a new `condition_id` shows up, fetch `https://gamma-api.polymarket.com/markets/{condition_id}` once, take the `category` field, and write it onto every `trades` row for that condition. Cheap to do at ingest with a small in-memory cache.

```python
@lru_cache(maxsize=1024)
def get_category(condition_id):
    r = requests.get(f'https://gamma-api.polymarket.com/markets/{condition_id}', timeout=5)
    return r.json().get('category') if r.ok else None
```

### Change 3 (REMOVAL): drop the inline Discord alert

`ingest.py` currently posts to a Discord webhook directly when `notional >= $100k`. **Remove that.** The new Vercel cron worker (`/api/alerts/run`) handles all alerts now, driven by the `alert_rules` table. To preserve current behavior, seed the rules table with a default rule:

```sql
INSERT INTO alert_rules (name, enabled, conditions, channel, webhook_url) VALUES (
  'Whale watch (≥ $100k notional)',
  true,
  '{"min_notional": 100000}'::jsonb,
  'discord',
  'PASTE_EXISTING_WEBHOOK_URL_HERE'
);
```

**Cutover:** keep the old alert in `ingest.py` until the Vercel worker is live and tested. Then merge a single PR that deletes the inline alert and inserts the seed rule. Don't run both — you'll get duplicate pings.

## New repo structure

```
polyanomalies/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                     # main dashboard
│   ├── markets/[id]/page.tsx
│   ├── wallets/[address]/page.tsx
│   ├── alerts/page.tsx
│   ├── @drawer/                     # parallel route for trade drawer
│   │   ├── default.tsx
│   │   └── (.)trade/[id]/page.tsx
│   └── api/
│       ├── trades/route.ts
│       ├── trades/[id]/route.ts
│       ├── markets/top/route.ts
│       ├── markets/[id]/route.ts
│       ├── wallets/top/route.ts
│       ├── wallets/[address]/route.ts
│       └── alerts/{route.ts,preview/route.ts,[id]/route.ts,run/route.ts}
├── components/                       # see components.md
├── lib/
│   ├── supabase.ts                   # createClient with anon key
│   ├── realtime.ts                   # subscribe helper
│   ├── fmt.ts                        # ported from prototype/shared.jsx
│   ├── mappers.ts                    # row → Trade/Market/Wallet (renames real columns)
│   └── types.ts                      # Trade, Market, Wallet, AlertRule
├── python/                           # optional: copy score.py + ingest.py here
├── public/
├── tailwind.config.ts
├── next.config.ts
├── vercel.json                       # cron for alerts/run
├── package.json
└── .env.local
```

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # for /api/alerts/run only, server-side
DISCORD_WEBHOOK_URL=...              # default fallback if rule has none
```

## Alert worker (`/api/alerts/run`)

`vercel.json`:

```json
{
  "crons": [{ "path": "/api/alerts/run", "schedule": "* * * * *" }]
}
```

Worker logic (every minute):
1. Read `cron_state.alerts_last_run`.
2. `SELECT * FROM trades WHERE timestamp > last_run`.
3. `SELECT * FROM alert_rules WHERE enabled = true`.
4. For each new trade × each rule, evaluate the JSON conditions. On match, POST to the rule's `webhook_url` (or fallback `DISCORD_WEBHOOK_URL`).
5. `UPDATE cron_state SET value = max(timestamp) WHERE key = 'alerts_last_run'`.

Idempotent on retry, single-pass, no per-trade state needed.

## Deployment
- Frontend → Vercel from the new repo. `next build` is enough.
- Database → existing Supabase, plus the migrations above.
- Ingest → existing cron host, with the `ingest.py` updates.
- Alert worker → Vercel cron.

## DNS
Point your existing domain at Vercel after smoke-testing on `*.vercel.app`.
