"use client";

import { LivePulse } from "@/components/LivePulse";
import { useRealtime } from "@/components/RealtimeProvider";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/realtime";

// Small "Live · Connecting · Disconnected" indicator for the top bar. Color
// reflects the Supabase channel connection state from <RealtimeProvider>.
export function LiveStatus() {
  const { status } = useRealtime();
  return (
    <span className="flex items-center gap-1.5 text-[11.5px] text-fg-dim">
      <LivePulse color={STATUS_COLORS[status]} size={6} />
      {STATUS_LABELS[status]}
    </span>
  );
}
