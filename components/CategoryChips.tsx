"use client";

import { clsx } from "clsx";
import { useUrlState } from "@/lib/urlState";

export function CategoryChips({ categories }: { categories: string[] }) {
  const { params, setParam } = useUrlState();

  // Per spec: hide the rail entirely until categories are populated.
  if (categories.length === 0) return null;

  const raw = params.get("categories") ?? "";
  const selected = new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));

  function toggle(cat: string) {
    const next = new Set(selected);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setParam("categories", next.size === 0 ? null : [...next].join(","));
  }

  return (
    <div className="flex flex-wrap gap-1.5 px-[18px] pb-3">
      {categories.map((cat) => {
        const on = selected.has(cat);
        return (
          <button
            key={cat}
            type="button"
            onClick={() => toggle(cat)}
            className={clsx(
              "rounded-full border px-2.5 py-1 font-mono text-[10.5px] tracking-[0.04em] uppercase transition-colors",
              on
                ? "border-green-soft bg-green-soft text-green"
                : "border-border bg-surface text-fg-dim hover:border-border-hi hover:text-fg",
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
