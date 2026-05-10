import { clsx } from "clsx";

// Layered pulsing dot — solid inner + animated outer expanding ring. Color
// surfaces connection state at a glance (green=connected, amber=connecting,
// red=disconnected). Ported from prototype/shared.jsx; the pa-pulse keyframe
// lives in app/globals.css.
export function LivePulse({
  color = "bg-green",
  size = 7,
}: {
  /** Tailwind background-color class for the dot. */
  color?: string;
  /** Pixel size of the dot. */
  size?: number;
}) {
  return (
    <span
      className="relative inline-flex"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className={clsx("absolute inset-0 rounded-full", color)}
        style={{ animation: "pa-pulse 2s ease-out infinite" }}
      />
      <span className={clsx("absolute inset-0 rounded-full", color)} />
    </span>
  );
}
