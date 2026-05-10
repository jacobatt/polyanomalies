"use client";

import { clsx } from "clsx";
import { useUrlState } from "@/lib/urlState";

const OPTIONS: { value: string; label: string }[] = [
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "72h", label: "72h" },
  { value: "7d", label: "7d" },
];

const DEFAULT = "24h";

export function TimeWindowToggle() {
  const { params, setParam } = useUrlState();
  const active = params.get("since") ?? DEFAULT;

  return (
    <div className="flex rounded-md bg-surface p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setParam("since", opt.value === DEFAULT ? null : opt.value)}
          className={clsx(
            "rounded-[4px] px-2.5 py-1 text-[11.5px] transition-colors",
            opt.value === active
              ? "bg-surface-2 text-fg"
              : "text-fg-dim hover:text-fg",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
