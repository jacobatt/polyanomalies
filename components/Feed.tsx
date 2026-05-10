"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Trade } from "@/lib/types";
import { FEED_GRID, FeedRow } from "@/components/FeedRow";

const FEED_CAP = 200;
const ROW_ESTIMATE = 48; // px — close to actual; virtualizer measures real

// Virtualized live feed. Caps rendered list at 200 rows (in-memory cap per
// spec.md § "Realtime"). Header row stays sticky-ish above the scrolling
// rows. Empty state placeholder until task 14 wires the proper EmptyState.
export function Feed({
  trades,
  newIds,
  onTradeClick,
}: {
  trades: Trade[];
  newIds?: Set<string>;
  onTradeClick?: (t: Trade) => void;
}) {
  const list = trades.slice(0, FEED_CAP);
  const parentRef = useRef<HTMLDivElement>(null);

  // React Compiler can't memoize TanStack Virtual's returned functions safely
  // (known library incompat). Suppression is correct here — disable the lint
  // and let the library handle its own internal memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: list.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 8,
  });

  return (
    <>
      {/* Header row — same grid as FeedRow */}
      <div
        className="grid gap-2.5 border-b border-border px-3.5 py-2 font-mono text-[10.5px] tracking-[0.08em] text-fg-faint uppercase"
        style={{ gridTemplateColumns: FEED_GRID }}
      >
        <span>Time</span>
        <span>Side</span>
        <span>Market · Outcome</span>
        <span>Wallet</span>
        <span className="text-right">Price</span>
        <span className="text-right">Notional</span>
        <span>Signals</span>
        <span className="text-right">Score</span>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 py-8 text-[12.5px] text-fg-dim">
          No trades match these filters in this window.
        </div>
      ) : (
        <div
          ref={parentRef}
          className="min-h-0 flex-1 overflow-y-auto"
          style={{ contain: "strict" }}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: "relative",
              width: "100%",
            }}
          >
            {virtualizer.getVirtualItems().map((vRow) => {
              const trade = list[vRow.index];
              return (
                <div
                  key={trade.id}
                  data-index={vRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  <FeedRow
                    trade={trade}
                    isNew={newIds?.has(trade.id) ?? false}
                    onClick={onTradeClick}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
