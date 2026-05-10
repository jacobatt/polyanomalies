"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Trade } from "@/lib/types";
import { summarize } from "@/lib/queries";
import { fmt } from "@/lib/fmt";
import { KpiCard } from "@/components/KpiCard";
import { ThresholdSlider } from "@/components/ThresholdSlider";
import { TimeWindowToggle } from "@/components/TimeWindowToggle";
import { CategoryChips } from "@/components/CategoryChips";

// Client wrapper around the dashboard contents. The RSC fetches trades by
// time window only; everything else (score threshold, categories, search
// query) is a client-side filter on the loaded set, per spec.md § "Filtering
// rules". URL params are the source of truth so the view is shareable.
export function Dashboard({
  trades,
  categories,
}: {
  trades: Trade[];
  categories: string[];
}) {
  const params = useSearchParams();

  const minScore = parseFloat(params.get("min_score") ?? "0");
  const catList = (params.get("categories") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const q = (params.get("q") ?? "").toLowerCase();

  const filtered = useMemo(() => {
    return trades.filter((t) => {
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
  }, [trades, minScore, catList, q]);

  const k = summarize(filtered);

  return (
    <>
      {/* Control row: title + time toggle + threshold slider + match count */}
      <div className="flex items-center gap-2.5 border-b border-border px-[18px] py-3">
        <h1 className="mr-2.5 text-[18px] font-semibold tracking-[-0.01em]">
          Anomaly monitor
        </h1>
        <TimeWindowToggle />
        <ThresholdSlider />
        <span className="ml-auto text-[11.5px] text-fg-dim">
          <span className="font-semibold text-fg">{filtered.length}</span> of{" "}
          {trades.length} trades match
        </span>
      </div>

      <CategoryChips categories={categories} />

      {/* KPI band — 5 cards per the desk-dashboard artboard */}
      <section
        className="grid gap-3 px-[18px] py-3.5"
        style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr" }}
      >
        <KpiCard
          label="24H NOTIONAL"
          value={fmt.usd(k.notional, { compact: true })}
          accent
        />
        <KpiCard label="ANOMALIES" value={k.anomalies} />
        <KpiCard label="WHALE TRADES" value={k.whales} sub="≥ $1M" />
        <KpiCard
          label="COUNTER-TREND"
          value={k.counterTrend}
          sub={
            k.anomalies > 0
              ? `${Math.round((k.counterTrend / k.anomalies) * 100)}%`
              : undefined
          }
        />
        <KpiCard label="MARKETS TOUCHED" value={k.markets} />
      </section>
    </>
  );
}
