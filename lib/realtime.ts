// Realtime types shared by the provider and consumers. Connection state
// drives the LivePulse color (green/amber/red) and the status label.

export type RealtimeStatus = "connecting" | "connected" | "error";

export const STATUS_COLORS: Record<RealtimeStatus, string> = {
  connecting: "bg-amber",
  connected: "bg-green",
  error: "bg-red",
};

export const STATUS_LABELS: Record<RealtimeStatus, string> = {
  connecting: "Connecting",
  connected: "Live",
  error: "Disconnected",
};
