# Components

Component inventory for the Next.js port. Build them in `components/` as pure presentational pieces; data wiring happens in route components.

## Layout
- **`<Shell>`** — top app bar with logo, live status pill, alerts bell. Renders children below. Used on every page except mobile (which has its own shell).
- **`<MobileShell>`** — narrow-viewport version with bottom-tab nav.

## Dashboard primitives
- **`<KpiCard label value sub trend? accent?>`** — the 4 stats across the top of the dashboard. `value` is mono, `accent="green"` colors it, `trend` shows up/down arrow + delta.
- **`<ThresholdSlider value onChange min=0 max=6 step=0.25>`** — the score threshold control with the value bubble.
- **`<TimeWindowToggle value onChange>`** — segmented control: 6h / 24h / 72h / 7d.
- **`<CategoryChips selected onChange categories>`** — multi-select chip row.
- **`<SearchInput value onChange placeholder>`** — the search box, mono font for the value.

## Feed
- **`<FeedRow trade onClick>`** — single row in the live feed. Side badge, time, market title, notional, price, wallet, score, signal tags. Entry animation via `data-new` + `pa-row-in` keyframe.
- **`<SignalTag kind>`** — `kind: 'whale' | 'mega' | 'ctr'`. Just the colored chip.
- **`<LivePulse color size>`** — the pulsing dot used in the "Live" status indicator.
- **`<Feed trades onTradeClick>`** — virtualized scrolling list of FeedRow. Cap at 200.

## Markets
- **`<MarketRow rank market notional anomalyCount onClick>`** — single row in the top-markets card and on the markets list.
- **`<MarketChart series anomalies highlightTradeId? onHover>`** — the price line with anomaly dots overlaid. SVG-based. `onHover` exposes the trade under the cursor.
- **`<MarketRecentTrades trades onTradeClick>`** — sub-list of trades for a single market.

## Wallets
- **`<WalletRow rank wallet notional anomalyCount winRate onClick>`** — leaderboard row.
- **`<WalletAvatar wallet size>`** — gradient block with first letter of pseudonym.
- **`<WalletPnLChart series>`** — area chart of cumulative PnL.
- **`<WalletExposure markets>`** — horizontal bar showing notional spread across markets.

## Trade detail drawer
- **`<TradeDrawer trade open onClose>`** — the 460px right-side overlay. Composes:
  - **`<DrawerStat label value sub accent?>`** — the three big stats at top
  - **`<SignalRow on label detail>`** — single signal in the checklist
  - **`<RelatedTrades title trades>`** — same-wallet / same-market sub-list
- Implement as a parallel route `@drawer` so URLs are linkable: `/?trade=abc123`.

## Alerts
- **`<AlertRuleCard rule onChange onDelete>`** — single rule with all its conditions. Inline-editable.
- **`<AlertConditionRow type value onChange>`** — score / notional / category / wallet / market condition.
- **`<AlertPreview rule>`** — runs `POST /api/alerts/preview` and shows match count + sample trades.

## States
- **`<EmptyState icon headline sub cta secondary>`** — used by `cold-start` and `no-matches` variants. Pass different copy/icons per variant.
- **`<LoadingState rows=6>`** — skeleton with KPI stubs and shimmer rows.
- **`<ErrorState error retryAt>`** — red-tinted error card with retry CTA.
- **`<Shimmer width height>`** — primitive used by LoadingState.

## Utilities
- **`fmt.usd(n, {compact})`** — `$1.2M` / `$1,234,567`
- **`fmt.num(n, decimals)`** — generic
- **`fmt.prob(p)`** — `48¢` style for prices in [0,1]
- **`fmt.ago(ts)`** — `3m`, `2h`, `4d`
- **`fmt.hhmm(ts)`** / **`fmt.hhmmShort(ts)`** — `14:32:07` / `14:32`
- **`fmt.shortAddr(addr)`** — `0x4f3a…f0a9`

Copy these from the prototype's `shared.jsx` verbatim, port to TypeScript.
