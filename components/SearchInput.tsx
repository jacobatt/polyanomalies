"use client";

import { useRef, useState } from "react";
import { useUrlState } from "@/lib/urlState";

const DEBOUNCE_MS = 250;

// Search box for the top bar. Local state for typing latency, debounced
// URL sync so the dashboard filter doesn't recompute on every keystroke.
export function SearchInput() {
  const { params, setParam } = useUrlState();
  const urlValue = params.get("q") ?? "";
  const [value, setValue] = useState(urlValue);
  const [lastUrlValue, setLastUrlValue] = useState(urlValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // External URL changes (back/forward, time-toggle clears, etc.) flow back
  // into the input. Documented React pattern: detect divergence in render
  // and snap local state to match.
  if (lastUrlValue !== urlValue) {
    setLastUrlValue(urlValue);
    setValue(urlValue);
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam("q", next.trim()), DEBOUNCE_MS);
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint">
        <SearchIcon />
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search markets, wallets…"
        className="w-[220px] rounded-md border border-border bg-surface py-1.5 pl-7 pr-2.5 font-mono text-[12px] text-fg outline-none placeholder:text-fg-faint focus:border-border-hi"
      />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 9 L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
