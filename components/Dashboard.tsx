"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlState } from "@/lib/urlState";
import type { Trade, TopMarket, TopWallet } from "@/lib/types";
import { summarize } from "@/lib/queries";
import { fmt } from "@/lib/fmt";
import { KpiCard } from "@/components/KpiCard";
import { ThresholdSlider } from "@/components/ThresholdSlider";
import { TimeWindowToggle } from "@/components/TimeWindowToggle";
import { CategoryChips } from "@/components/CategoryChips";
import { Card } from "@/components/Card";
import { Feed } from "@/components/Feed";
import { MarketRow } from "@/components/MarketRow";
import { WalletRow } from "@/components/WalletRow";
import { useRealtime } from "@/components/RealtimeProvider";

const FEED_CAP = 200;
const NEW_FLASH_MS = 1700; // matches pa-row-in animation duration

// Client wrapper around the dashboard contents. The RSC fetches trades by
// time window only; everything else (score threshold, categories, search
// query) is a client-side filter on the loaded set, per spec.md § "Filtering
// rules". URL params are the source of truth so the view is shareable.
export function Dashboard({
  trades,
  categories,
  topMarkets,
  topWallets,
}: {
  trades: Trade[];
  categories: string[];
  topMarkets: TopMarket[];
  topWallets: TopWallet[];
}) {
  const params = useSearchParams();
  const { setParam } = useUrlState();
  const { onTrade } = useRealtime();

  // Realtime trades layered on top of the SSR'd window. Keyed by id so
  // re-broadcasts (e.g. INSERT then UPDATE-with-score) collapse to one row.
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    return onTrade((t) => {
      setLiveTrades((prev) => {
        const without = prev.filter((p) => p.id !== t.id);
        return [t, ...without].slice(0, FEED_CAP);
      });
      setNewIds((prev) => {
        const next = new Set(prev);
        next.add(t.id);
        return next;
      });
      // Drop the new-ID flag after the entry animation runs.
      setTimeout(() => {
        setNewIds((prev) => {
          if (!prev.has(t.id)) return prev;
          const next = new Set(prev);
          next.delete(t.id);
          return next;
        });
      }, NEW_FLASH_MS);
    });
  }, [onTrade]);

  // Merge SSR + live, dedup by id, keep newest order. Live entries land at
  // the top because liveTrades is prepend-on-arrival; SSR list is by ts desc.
  const merged = useMemo(() => {
    const liveIds = new Set(liveTrades.map((t) => t.id));
    return [...liveTrades, ...trades.filter((t) => !liveIds.has(t.id))].slice(
      0,
      FEED_CAP,
    );
  }, [trades, liveTrades]);

  const minScore = parseFloat(params.get("min_score") ?? "0");
  const catList = (params.get("categories") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const q = (params.get("q") ?? "").toLowerCase();

  const filtered = useMemo(() => {
    return merged.filter((t) => {
      if ((t.score ?? -Infinity) < minScore) return false;
      if (catList.length > 0) {
        if (!t.market.category || !catList.includes(t.market.category)) return false;
      }
      if (q) {
        const hay = (t.market.title + " " + (t.wallet.pseudonym ?? "") + " " + (t.wallet.name ?? "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [merged, minScore, catList, q]);

  const k = summarize(filtered);

  return (
    <>
      {/* Control row: title + time toggle + threshold slider + match count */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-3 py-3 md:px-[18px]">
        <h1 className="mr-2.5 text-[16px] font-semibold tracking-[-0.01em] md:text-[18px]">
          Anomaly monitor
        </h1>
        <TimeWindowToggle />
        <ThresholdSlider />
        <span className="ml-auto text-[11.5px] text-fg-dim">
          <span className="font-semibold text-fg">{filtered.length}</span> of{" "}
          {merged.length} trades match
        </span>
      </div>

      <CategoryChips categories={categories} />

      {/* KPI band — 5 cards. Desktop: 1.4fr/1fr/1fr/1fr/1fr grid. Mobile:
          horizontal-scrolling strip per spec.md mobile rules. */}
      <section
        className="-mx-3 flex gap-3 overflow-x-auto px-3 py-3.5 [scrollbar-width:none] md:mx-0 md:grid md:overflow-visible md:px-[18px]"
        style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr" }}
      >
        <div className="min-w-[200px] flex-none md:min-w-0">
          <KpiCard
            label="24H NOTIONAL"
            value={fmt.usd(k.notional, { compact: true })}
            accent
          />
        </div>
        <div className="min-w-[140px] flex-none md:min-w-0">
          <KpiCard label="ANOMALIES" value={k.anomalies} />
        </div>
        <div className="min-w-[140px] flex-none md:min-w-0">
          <KpiCard label="WHALE TRADES" value={k.whales} sub="≥ $1M" />
        </div>
        <div className="min-w-[140px] flex-none md:min-w-0">
          <KpiCard
            label="COUNTER-TREND"
            value={k.counterTrend}
            sub={
              k.anomalies > 0
                ? `${Math.round((k.counterTrend / k.anomalies) * 100)}%`
                : undefined
            }
          />
        </div>
        <div className="min-w-[140px] flex-none md:min-w-0">
          <KpiCard label="MARKETS TOUCHED" value={k.markets} />
        </div>
      </section>

      {/* Main grid: single-column below md, 1.6fr/1fr above. */}
      <section
        className="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-3 md:grid md:px-[18px] md:pb-[18px]"
        style={{ gridTemplateColumns: "1.6fr 1fr" }}
      >
        <Card
          title="Live anomaly feed"
          right={
            <span className="flex items-center gap-2 text-[11.5px] text-fg-dim">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green" />
              auto-refresh on · click row to inspect
            </span>
          }
        >
          <Feed
            trades={filtered}
            newIds={newIds}
            onTradeClick={(t) => setParam("trade", t.id)}
          />
        </Card>

        <div className="flex min-h-0 flex-col gap-3">
          <Card title="Hot markets" subtitle="By notional in window">
            <div className="overflow-y-auto">
              {topMarkets.length === 0 ? (
                <div className="px-3.5 py-6 text-[12.5px] text-fg-dim">
                  No scored markets in this window yet.
                </div>
              ) : (
                topMarkets.map((m) => <MarketRow key={m.id} market={m} />)
              )}
            </div>
          </Card>

          <Card
            title="Top wallets"
            subtitle="By notional in window"
            className="flex-1"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              {topWallets.length === 0 ? (
                <div className="px-3.5 py-6 text-[12.5px] text-fg-dim">
                  No scored wallet activity in this window yet.
                </div>
              ) : (
                topWallets.map((w, i) => (
                  <WalletRow key={w.wallet} wallet={w} rank={i + 1} />
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
