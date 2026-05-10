import type { ReactNode } from "react";

// Reusable card shell — title + optional subtitle + optional right slot,
// scroll-clipped body. Used by the live feed and the right-side cards
// (Hot markets, Top wallets — task 8).
export function Card({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-border bg-surface ${className ?? ""}`}
    >
      <div className="flex items-center border-b border-border px-3.5 py-3">
        <div>
          <div className="text-[13.5px] font-semibold">{title}</div>
          {subtitle && (
            <div className="mt-0.5 text-[11px] text-fg-dim">{subtitle}</div>
          )}
        </div>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
