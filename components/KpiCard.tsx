import type { ReactNode } from "react";
import { clsx } from "clsx";

// Top-of-dashboard KPI tile. Matches the desk-dashboard `DeskKpi` artboard.
// Values render in IBM Plex Sans (matching prototype) at 24px / 600.
export function KpiCard({
  label,
  value,
  sub,
  delta,
  accent,
  chart,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: ReactNode;
  accent?: boolean;
  chart?: ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface px-3.5 py-3">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-fg-dim uppercase">
          {label}
        </span>
        {delta && (
          <span className="font-mono text-[10.5px] text-green">{delta}</span>
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className={clsx(
            "text-[24px] font-semibold tracking-[-0.02em]",
            accent ? "text-green" : "text-fg",
          )}
        >
          {value}
        </span>
        {sub && <span className="text-[11px] text-fg-dim">{sub}</span>}
      </div>
      {chart && <div className="mt-1">{chart}</div>}
    </div>
  );
}
