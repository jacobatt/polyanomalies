"use client";

import Link from "next/link";
import { clsx } from "clsx";
import type { Trade } from "@/lib/types";
import { fmt } from "@/lib/fmt";

// Compact recent-trades list for /markets/[id] and the trade drawer's
// related sub-lists. Click → opens the trade drawer.
export function MarketRecentTrades({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[12.5px] text-fg-dim">
        No scored trades on this market in the window.
      </div>
    );
  }
  return (
    <div>
      <div
        className="grid gap-2.5 border-b border-border px-3.5 py-2 font-mono text-[10.5px] tracking-[0.08em] text-fg-faint uppercase"
        style={{ gridTemplateColumns: "60px 56px 1fr 110px 90px 50px" }}
      >
        <span>Time</span>
        <span>Side</span>
        <span>Wallet</span>
        <span className="text-right">Price</span>
        <span className="text-right">Notional</span>
        <span className="text-right">Score</span>
      </div>
      {trades.map((t) => (
        <Link
          key={t.id}
          href={`?trade=${encodeURIComponent(t.id)}`}
          scroll={false}
          className="grid items-center gap-2.5 border-b border-border px-3.5 py-2.5 text-[12.5px] no-underline hover:bg-surface-2"
          style={{ gridTemplateColumns: "60px 56px 1fr 110px 90px 50px" }}
        >
          <span className="font-mono text-[11.5px] text-fg-dim">
            {fmt.hhmmShort(t.ts)}
          </span>
          <span
            className={clsx(
              "self-start w-fit rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.04em]",
              t.side === "BUY" ? "bg-green-soft text-green" : "bg-red-soft text-red",
            )}
          >
            {t.side}
          </span>
          <span className="overflow-hidden whitespace-nowrap text-ellipsis">
            <div className="text-fg">
              {t.wallet.pseudonym ?? t.wallet.name ?? ""}
            </div>
            <div className="font-mono text-[10.5px] text-fg-faint">
              {fmt.shortAddr(t.wallet.wallet)}
            </div>
          </span>
          <span className="text-right font-mono text-fg-dim">
            {fmt.prob(t.price)}
          </span>
          <span
            className={clsx(
              "text-right font-mono font-semibold",
              t.notional >= 1_000_000 ? "text-amber" : "text-fg",
            )}
          >
            {fmt.usd(t.notional, { compact: true })}
          </span>
          <span className="text-right font-mono text-[13px] font-bold text-green">
            {(t.score ?? 0).toFixed(2)}
          </span>
        </Link>
      ))}
    </div>
  );
}
