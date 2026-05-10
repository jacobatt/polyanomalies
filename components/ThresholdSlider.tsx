"use client";

import { useRef, useState } from "react";
import { useUrlState } from "@/lib/urlState";

const MIN = 0;
const MAX = 6;
const STEP = 0.25;
const DEBOUNCE_MS = 120;

// Score-threshold slider for the filter bar. Local state for instant
// drag feedback, debounced URL sync so the page doesn't refetch on every
// pixel of drag (the page is force-dynamic; URL changes trigger re-renders).
export function ThresholdSlider() {
  const { params, setParam } = useUrlState();
  const urlRaw = params.get("min_score") ?? "0";
  const urlValue = Number.isNaN(parseFloat(urlRaw)) ? 0 : parseFloat(urlRaw);
  const [value, setValue] = useState(urlValue);
  const [lastUrlValue, setLastUrlValue] = useState(urlValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Snap local state to URL when the URL changes externally (browser back,
  // direct nav, etc.). Same divergence-in-render pattern as SearchInput.
  if (lastUrlValue !== urlValue) {
    setLastUrlValue(urlValue);
    setValue(urlValue);
  }

  function onChange(next: number) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setParam("min_score", next === 0 ? null : String(next)),
      DEBOUNCE_MS,
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-surface px-3 py-1">
      <span className="text-[11.5px] text-fg-dim">Score ≥</span>
      <input
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: 100, accentColor: "var(--green)" }}
        aria-label="Minimum anomaly score"
      />
      <span className="w-8 font-mono text-[11.5px] font-semibold tabular-nums">
        {value.toFixed(2)}
      </span>
    </div>
  );
}
