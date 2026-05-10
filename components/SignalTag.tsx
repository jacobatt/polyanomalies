import { clsx } from "clsx";

// Tiny mono pill shown in the feed's Signals column. Three kinds:
//   whale → notional ≥ $1M  (green)
//   mega  → notional ≥ $5M  (red)
//   ctr   → counter-trend   (amber)
export type SignalKind = "whale" | "mega" | "ctr";

const STYLES: Record<SignalKind, { label: string; cls: string }> = {
  whale: { label: "WHALE", cls: "bg-green-soft text-green" },
  mega:  { label: "MEGA",  cls: "bg-red-soft text-red" },
  ctr:   { label: "CTR",   cls: "text-amber" },
};

export function SignalTag({ kind }: { kind: SignalKind }) {
  const s = STYLES[kind];
  return (
    <span
      className={clsx(
        "rounded-[3px] px-1.5 py-px font-mono text-[9.5px] font-semibold tracking-[0.04em]",
        s.cls,
      )}
      style={kind === "ctr" ? { background: "rgba(245, 158, 11, 0.15)" } : undefined}
    >
      {s.label}
    </span>
  );
}
