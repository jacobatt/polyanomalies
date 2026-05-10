"use client";

import { clsx } from "clsx";
import type { Trade } from "@/lib/types";
import { fmt } from "@/lib/fmt";
import { SignalTag } from "@/components/SignalTag";

// Single row in the live anomaly feed. Matches the desk-dashboard artboard
// exactly: 8 columns, 60/56/1fr/110/70/90/90/50, 12.5px body / mono numbers.
// `isNew` triggers the pa-row-in flash for trades arriving via realtime.
export const FEED_GRID = "60px 56px 1fr 110px 70px 90px 90px 50px";

export function FeedRow({
  trade,
  isNew = false,
  onClick,
}: {
  trade: Trade;
  isNew?: boolean;
  onClick?: (t: Trade) => void;
}) {
  const t = trade;
  const score = t.score ?? 0;
  const whale = t.notional >= 1_000_000;
  const mega = t.notional >= 5_000_000;

  return (
    <div
      onClick={onClick ? () => onClick(t) : undefined}
      data-new={isNew || undefined}
      className={clsx(
        "grid cursor-pointer items-center gap-2.5 border-b border-border px-3.5 py-2.5 text-[12.5px] hover:bg-surface-2",
        isNew && "pa-row-in",
      )}
      style={{ gridTemplateColumns: FEED_GRID }}
    >
      {/* Time */}
      <span className="font-mono text-[11.5px] text-fg-dim">
        {fmt.hhmmShort(t.ts)}
      </span>

      {/* Side pill */}
      <span
        className={clsx(
          "self-start w-fit rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.04em]",
          t.side === "BUY" ? "bg-green-soft text-green" : "bg-red-soft text-red",
        )}
      >
        {t.side}
      </span>

      {/* Market · Outcome */}
      <span className="overflow-hidden">
        <div className="overflow-hidden whitespace-nowrap text-ellipsis text-fg">
          {t.market.title}
        </div>
        <div className="text-[10.5px] text-fg-faint">
          {[t.market.category, t.outcome].filter(Boolean).join(" · ")}
        </div>
      </span>

      {/* Wallet */}
      <span className="overflow-hidden whitespace-nowrap text-ellipsis">
        <div className="text-fg">{t.wallet.pseudonym ?? t.wallet.name ?? ""}</div>
        <div className="font-mono text-[10.5px] text-fg-faint">
          {fmt.shortAddr(t.wallet.wallet)}
        </div>
      </span>

      {/* Price */}
      <span className="text-right font-mono text-fg-dim">{fmt.prob(t.price)}</span>

      {/* Notional — amber if ≥ $1M */}
      <span
        className={clsx(
          "text-right font-mono font-semibold",
          whale ? "text-amber" : "text-fg",
        )}
      >
        {fmt.usd(t.notional, { compact: true })}
      </span>

      {/* Signals */}
      <span className="flex flex-wrap items-center gap-1">
        {t.counterTrend && <SignalTag kind="ctr" />}
        {whale && <SignalTag kind="whale" />}
        {mega && <SignalTag kind="mega" />}
      </span>

      {/* Score */}
      <span className="text-right font-mono text-[13px] font-bold text-green">
        {score.toFixed(2)}
      </span>
    </div>
  );
}
