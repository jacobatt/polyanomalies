"use client";

import type { ReactNode } from "react";

// Cumulative signed notional area chart. v1 stand-in for true PnL until
// we have settlement data — BUYs add, SELLs subtract.
export function WalletPnLChart({
  series,
  height = 200,
}: {
  series: { ts: number; value: number }[];
  height?: number;
}) {
  if (series.length < 2) {
    return (
      <Empty height={height}>Not enough activity to chart yet.</Empty>
    );
  }
  const W = 1200;
  const H = height;
  const padX = 16;
  const padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const minTs = series[0].ts;
  const maxTs = series[series.length - 1].ts;
  const tsSpan = maxTs - minTs || 1;
  const minV = Math.min(0, ...series.map((p) => p.value));
  const maxV = Math.max(0, ...series.map((p) => p.value));
  const span = maxV - minV || 1;
  const xOf = (ts: number) => padX + ((ts - minTs) / tsSpan) * innerW;
  const yOf = (v: number) => padY + (1 - (v - minV) / span) * innerH;
  const baseY = yOf(0);
  const linePath = series
    .map((p, i) => `${i ? "L" : "M"}${xOf(p.ts).toFixed(1)},${yOf(p.value).toFixed(1)}`)
    .join(" ");
  const fillPath = `${linePath} L${xOf(maxTs).toFixed(1)},${baseY.toFixed(1)} L${xOf(minTs).toFixed(1)},${baseY.toFixed(1)} Z`;
  const final = series[series.length - 1].value;
  const accent = final >= 0 ? "var(--green)" : "var(--red)";
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="block w-full"
      style={{ height }}
    >
      <line x1={padX} x2={W - padX} y1={baseY} y2={baseY} stroke="var(--border)" strokeDasharray="2 4" />
      <path d={fillPath} fill={accent} opacity="0.1" />
      <path d={linePath} stroke={accent} strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function Empty({ height, children }: { height: number; children: ReactNode }) {
  return (
    <div
      className="flex w-full items-center justify-center text-fg-dim"
      style={{ height }}
    >
      {children}
    </div>
  );
}
