"use client";

import { useState, type MouseEvent } from "react";
import type { Trade } from "@/lib/types";
import { fmt } from "@/lib/fmt";

// Price line + anomaly dots overlay. Hover anywhere on the chart to lock
// the nearest dot's tooltip. Pure SVG, no chart lib.
export function MarketChart({
  series,
  trades,
  height = 260,
  onTradeHover,
}: {
  series: { ts: number; price: number }[];
  trades: Trade[];
  height?: number;
  onTradeHover?: (t: Trade | null) => void;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (series.length < 2) {
    return (
      <div
        className="flex w-full items-center justify-center text-fg-dim"
        style={{ height }}
      >
        Not enough price points yet.
      </div>
    );
  }

  const W = 1200; // viewBox; svg is responsive via CSS
  const H = height;
  const padX = 16;
  const padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const minTs = series[0].ts;
  const maxTs = series[series.length - 1].ts;
  const tsSpan = maxTs - minTs || 1;
  const minP = Math.min(...series.map((p) => p.price));
  const maxP = Math.max(...series.map((p) => p.price));
  const span = maxP - minP || 1;
  const xOf = (ts: number) => padX + ((ts - minTs) / tsSpan) * innerW;
  const yOf = (p: number) => padY + (1 - (p - minP) / span) * innerH;

  const linePath = series
    .map((p, i) => `${i ? "L" : "M"}${xOf(p.ts).toFixed(1)},${yOf(p.price).toFixed(1)}`)
    .join(" ");
  const fillPath = `${linePath} L${xOf(maxTs).toFixed(1)},${padY + innerH} L${xOf(minTs).toFixed(1)},${padY + innerH} Z`;

  // Anomaly dots: only ones inside the chart's time window
  const visible = trades.filter((t) => t.ts >= minTs && t.ts <= maxTs);

  function onMouseMove(e: MouseEvent<SVGSVGElement>) {
    if (visible.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xLocal = ((e.clientX - rect.left) / rect.width) * W;
    let bestI = 0;
    let bestD = Infinity;
    for (let i = 0; i < visible.length; i++) {
      const dx = Math.abs(xOf(visible[i].ts) - xLocal);
      if (dx < bestD) {
        bestD = dx;
        bestI = i;
      }
    }
    setHoverIdx(bestI);
    onTradeHover?.(visible[bestI]);
  }
  function onMouseLeave() {
    setHoverIdx(null);
    onTradeHover?.(null);
  }

  const hovered = hoverIdx != null ? visible[hoverIdx] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <path d={fillPath} fill="var(--green)" opacity="0.08" />
        <path d={linePath} stroke="var(--green)" strokeWidth="1.4" fill="none" />
        {visible.map((t, i) => {
          const isHover = i === hoverIdx;
          const r = isHover ? 7 : 4;
          const isWhale = t.notional >= 1_000_000;
          const fill = isWhale ? "var(--amber)" : "var(--green)";
          return (
            <g key={t.id}>
              <circle
                cx={xOf(t.ts)}
                cy={yOf(t.price)}
                r={r + 4}
                fill={fill}
                fillOpacity="0.18"
              />
              <circle
                cx={xOf(t.ts)}
                cy={yOf(t.price)}
                r={r}
                fill={fill}
                stroke="var(--bg)"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[11.5px] shadow-md"
          style={{
            left: `min(calc(${(xOf(hovered.ts) / W) * 100}% + 8px), calc(100% - 220px))`,
            top: `${(yOf(hovered.price) / H) * 100}%`,
            transform: "translateY(-50%)",
            maxWidth: 220,
          }}
        >
          <div className="font-mono text-[10px] tracking-[0.08em] text-fg-faint uppercase">
            {fmt.hhmm(hovered.ts)}
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className={hovered.side === "BUY" ? "text-green" : "text-red"}>
              {hovered.side}
            </span>
            <span className="font-mono font-semibold">
              {fmt.usd(hovered.notional, { compact: true })}
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[10.5px] text-fg-dim">
            price {fmt.prob(hovered.price)} · score {(hovered.score ?? 0).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
