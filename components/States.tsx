"use client";

import { useEffect, useState, type ReactNode } from "react";

// Skeleton primitive — animated linear gradient sweep, used by LoadingState.
export function Shimmer({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={`pa-shimmer block rounded ${className}`}
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
        backgroundSize: "200% 100%",
        animation: "pa-shimmer 1.4s linear infinite",
        ...style,
      }}
    />
  );
}

export function EmptyState({
  icon,
  headline,
  sub,
  cta,
  secondary,
}: {
  icon?: ReactNode;
  headline: string;
  sub?: ReactNode;
  cta?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon && <div className="text-fg-faint">{icon}</div>}
      <div className="text-[14px] font-semibold text-fg">{headline}</div>
      {sub && <div className="max-w-sm text-[12.5px] text-fg-dim">{sub}</div>}
      <div className="mt-1 flex gap-2">
        {cta}
        {secondary}
      </div>
    </div>
  );
}

// Skeleton for a list view: KPI strip + shimmery rows.
export function LoadingState({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 px-[18px] py-3.5">
      <div className="grid gap-3" style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-[10px] border border-border bg-surface px-3.5 py-3">
            <Shimmer className="h-2 w-1/2" />
            <Shimmer className="mt-2 h-6 w-1/3" />
          </div>
        ))}
      </div>
      <div className="rounded-[10px] border border-border bg-surface">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid items-center gap-2.5 border-b border-border px-3.5 py-2.5"
            style={{ gridTemplateColumns: "60px 56px 1fr 110px 70px 90px 90px 50px" }}
          >
            <Shimmer className="h-3" />
            <Shimmer className="h-3" />
            <Shimmer className="h-3" />
            <Shimmer className="h-3" />
            <Shimmer className="h-3" />
            <Shimmer className="h-3" />
            <Shimmer className="h-3" />
            <Shimmer className="h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Red-tinted error card with a 10s auto-retry counter (per spec.md task 14).
export function ErrorState({
  message,
  onRetry,
  autoRetryMs = 10_000,
}: {
  message?: string;
  onRetry?: () => void;
  autoRetryMs?: number;
}) {
  const [secondsLeft, setSecondsLeft] = useState(
    onRetry ? Math.ceil(autoRetryMs / 1000) : 0,
  );

  useEffect(() => {
    if (!onRetry) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, Math.ceil((autoRetryMs - elapsed) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        clearInterval(tick);
        onRetry();
      }
    }, 250);
    return () => clearInterval(tick);
  }, [onRetry, autoRetryMs]);

  return (
    <div
      className="m-[18px] flex flex-col items-start gap-2 rounded-[10px] border bg-red-soft p-4"
      style={{ borderColor: "rgba(239,68,68,0.3)" }}
    >
      <div className="text-[13px] font-semibold text-red">Couldn’t load data</div>
      {message && (
        <div className="font-mono text-[11.5px] text-fg-dim">{message}</div>
      )}
      {onRetry && (
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[11.5px] text-fg hover:border-border-hi"
          >
            Retry now
          </button>
          <span className="text-[11.5px] text-fg-dim">
            Auto-retrying in {secondsLeft}s
          </span>
        </div>
      )}
    </div>
  );
}
