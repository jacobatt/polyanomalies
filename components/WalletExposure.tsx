import Link from "next/link";
import { fmt } from "@/lib/fmt";

// Horizontal stacked bar of notional spread across markets. Below the
// bar, a small legend lists each segment with its share %.
export function WalletExposure({
  markets,
}: {
  markets: { id: string; title: string; notional: number }[];
}) {
  if (markets.length === 0) {
    return <div className="text-fg-dim">No markets touched.</div>;
  }
  const total = markets.reduce((s, m) => s + m.notional, 0) || 1;
  const palette = [
    "var(--green)",
    "#3aa6ff",
    "var(--amber)",
    "#a78bfa",
    "#f472b6",
    "var(--fg-dim)",
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 w-full overflow-hidden rounded">
        {markets.map((m, i) => (
          <div
            key={m.id}
            style={{
              width: `${(m.notional / total) * 100}%`,
              background: palette[i % palette.length],
            }}
            title={`${m.title} — ${fmt.usd(m.notional, { compact: true })}`}
          />
        ))}
      </div>
      <ul className="flex flex-col gap-1.5">
        {markets.map((m, i) => (
          <li
            key={m.id}
            className="grid items-center gap-2.5 text-[12px]"
            style={{ gridTemplateColumns: "10px 1fr 90px 50px" }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: palette[i % palette.length] }}
            />
            <Link
              href={`/markets/${encodeURIComponent(m.id)}`}
              className="overflow-hidden whitespace-nowrap text-ellipsis text-fg no-underline hover:text-green"
            >
              {m.title}
            </Link>
            <span className="text-right font-mono font-semibold text-fg">
              {fmt.usd(m.notional, { compact: true })}
            </span>
            <span className="text-right font-mono text-fg-dim">
              {((m.notional / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
