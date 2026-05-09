# Tasks

Work through in order. Open `prototype/PolyAnomalies.html` in a browser tab and keep it visible — the B-direction artboards are the visual target.

---

## Phase 0 — Prereqs (one-time)

### 0a. Accounts
- Vercel account, GitHub app installed on org
- Empty GitHub repo `polyanomalies`

### 0b. Supabase setup
- Enable Realtime on `public.trades` (Database → Replication → toggle on)
- Confirm RLS allows `SELECT` for `anon` on `trades`. If not, add:
  ```sql
  CREATE POLICY "trades read" ON trades FOR SELECT TO anon USING (true);
  ```

### 0c. DB migrations
Run all four blocks from `migration.md` § "DB migrations" in the Supabase SQL editor:
1. Add `score`, `notional_score`, `counter_trend`, `category` columns + indexes
2. Create `markets` and `wallets` views
3. Create `alert_rules` and `cron_state` tables
4. Backfill scores on existing rows (one-off Python script that reads `trades`, calls `score.py`, writes columns)

### 0d. Update `ingest.py`
- Import `score`, compute `{score, notional_score, counter_trend}` per row, write at insert time
- Add Gamma API category enrichment with `lru_cache`
- **Do not remove the inline Discord alert yet** — that comes after the worker is live (task 13)

### 0e. Stand up the prototype preview server (do this first if the HTML is blank)
`prototype/PolyAnomalies.html` is a thin shell that loads JSX modules — opening it directly in a browser shows a blank page. Set up a local preview before any frontend work so you can actually see what you're matching against.

- `cd prototype` and initialize a Vite + React app there: `npm create vite@latest . -- --template react`. When it asks about overwriting non-empty directory, say yes (the existing `.jsx` and `.html` files stay; Vite only adds config + `package.json`).
- Replace Vite's default `index.html` with the existing `PolyAnomalies.html`, or wire `main.jsx` as the entry per whatever the existing HTML expects. Read `PolyAnomalies.html` and `main.jsx` first to see the exact entry-point convention the prototype uses, then adapt Vite's config to match.
- Install any peer deps the JSX files import — likely `react`, `react-dom`, and any chart/animation libraries referenced inline.
- `npm run dev` should serve the prototype at `http://localhost:5173` (or similar). Verify the B-direction "Trading desk" artboard renders. Keep the dev server running in a side terminal during all subsequent visual work.
- The `prototype/` folder has its own `package.json` and `node_modules/`. Add `prototype/node_modules/` to the project's root `.gitignore` so it doesn't get committed.
- This is the prototype only. The actual Next.js app is built at the repo root in Phase 1.

---

## Phase 1 — Foundation

### 1. Scaffold
- `npx create-next-app@latest polyanomalies --typescript --tailwind --app --no-src-dir`
- Install: `@supabase/supabase-js`, `@supabase/ssr`, `clsx`
- Configure `tailwind.config.ts` to extend with the colors and fonts from `tokens.md`
- Wire IBM Plex Sans + Mono via `next/font/google` in `app/layout.tsx`
- Paste the token CSS variables into `app/globals.css`

### 2. Supabase client + types + mappers
- `lib/supabase.ts` — server and client factories
- `lib/types.ts` — `Trade`, `Market`, `Wallet`, `AlertRule` in clean shape
- `lib/mappers.ts` — `rowToTrade(row)` that maps real columns (`timestamp` → `ts`, `condition_id` → `market.id`, `proxy_wallet` → `wallet.wallet`, `taker_pseudonym` → `wallet.pseudonym`, etc.). Use this at every API boundary.
- `lib/fmt.ts` — port formatters from `prototype/shared.jsx` to TS

### 3. Shell + routing
- `<Shell>` matching the prototype's top bar
- Stub pages at all four routes — shell + placeholder
- Verify routing works, fonts load, colors render right

---

## Phase 2 — Main dashboard (`/`)

### 4. KPI row
- `GET /api/trades?since=24h` returns mapped trades
- `<KpiCard>` × 4: 24h notional, anomalies, whales, markets
- Server-rendered initial values

### 5. Threshold + filters
- `<ThresholdSlider>` with URL sync (`?min_score=4.5`)
- `<TimeWindowToggle>` syncing `?since=`
- `<CategoryChips>` syncing `?categories=` — hide if no categories in data yet (shouldn't happen post-task 0d, but guard anyway)
- `<SearchInput>` syncing `?q=`

### 6. Live feed
- `<FeedRow>` matching prototype exactly
- `<Feed>` virtualized container (`@tanstack/react-virtual`), cap 200 rows

### 7. Realtime
- `lib/realtime.ts` — Supabase channel subscription on `trades` insert
- New rows prepend with `@keyframes pa-row-in` from prototype
- Reconnect with `<LivePulse>` color: green / amber / red

### 8. Top markets + top wallets cards
- `GET /api/markets/top` and `/api/wallets/top` (queries in `spec.md`)
- `<MarketRow>` and `<WalletRow>` clickable → detail pages

---

## Phase 3 — Detail surfaces

### 9. Trade drawer (parallel route `@drawer`)
- URL: `/?trade=:id` opens drawer
- `<TradeDrawer>` matches artboard exactly
- Mini chart, signal checklist, related trades
- ESC + backdrop click + close button all clear `?trade=`

### 10. Market detail (`/markets/[id]`)
- `GET /api/markets/[id]?window=24h`
- `<MarketChart>` with anomaly dots, hover tooltip
- Recent trades table

### 11. Wallet profile (`/wallets/[address]`)
- `GET /api/wallets/[address]`
- `<WalletPnLChart>` cumulative PnL
- `<WalletExposure>` horizontal stacked bar
- Recent trades

---

## Phase 4 — Alerts

### 12. Alert UI (`/alerts`)
- `<AlertRuleCard>` list with inline editing
- New rule button creates default rule
- Toggle to enable/disable per rule
- `<AlertPreview>` calls `/api/alerts/preview`

### 13. Alert worker + cutover
- `vercel.json` cron: `/api/alerts/run` every minute
- `/api/alerts/run` — see `migration.md` § "Alert worker"
- **Test locally first.** Hit the route with a known-matching trade timestamp and confirm Discord ping arrives.
- Once live and verified: PR that (a) seeds the legacy `≥ $100k` rule into `alert_rules`, (b) deletes the inline Discord call from `ingest.py`. Single atomic change. Don't run both schedulers.

---

## Phase 5 — States + polish

### 14. Empty / loading / error states
- All four states from `states` artboard, on every list view
- 10s retry on Supabase failure → `<ErrorState>`

### 15. Mobile layout
- Match `mobile` artboard
- `md:` breakpoint
- Bottom-tab nav, horizontal-scroll KPIs

### 16. Final polish
- Pixel match against prototype on 1480-wide viewport
- Lighthouse pass — perf + a11y
- `<title>` and OG meta on every route
- Deploy to Vercel, point domain
- Smoke test against production data
- Delete the Streamlit deployment

---

## Out of bounds

- No auth, sign-up, or watchlists
- No changes to `score.py`'s formula
- No email/Telegram/SMS alert channels
- No schema changes beyond what's in `migration.md` § "DB migrations"
- No new pages or sections beyond the prototype
- No state library (Redux/Zustand) — URL params + React state are enough
- No UI library — components are simple, build them directly. Exception: `@radix-ui/react-dialog` for the drawer if it saves real time on a11y.
