"use client";

import Link from "next/link";
import type { TopMarket } from "@/lib/types";
import { fmt } from "@/lib/fmt";

// Single row in the Hot markets card. Click → /markets/[id]. Notional is
// amber-mono (matches the feed's whale notional). Subline shows category +
// trade count + anomaly count, paralleling the prototype's "category · X
// flagged · buys/sells" line (we don't track buy/sell split server-side
// yet, so trades + anomalies stand in).
export function MarketRow({ market }: { market: TopMarket }) {
  return (
    <Link
      href={`/markets/${encodeURIComponent(market.id)}`}
      className="grid items-center gap-2.5 border-b border-border px-3.5 py-3 no-underline hover:bg-surface-2"
      style={{ gridTemplateColumns: "1fr 90px" }}
    >
      <div className="overflow-hidden">
        <div className="overflow-hidden whitespace-nowrap text-ellipsis font-medium text-fg">
          {market.title}
        </div>
        <div className="mt-0.5 text-[10.5px] text-fg-faint">
          {[
            market.category,
            `${market.tradeCount} ${market.tradeCount === 1 ? "trade" : "trades"}`,
            market.anomalyCount > 0 ? `${market.anomalyCount} flagged` : null,
            market.lastPrice != null ? `last ${fmt.prob(market.lastPrice)}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      <div className="text-right font-mono font-semibold text-amber">
        {fmt.usd(market.notional, { compact: true })}
      </div>
    </Link>
  );
}
