import Link from "next/link";
import type { ReactNode } from "react";
import { SearchInput } from "@/components/SearchInput";
import { LiveStatus } from "@/components/LiveStatus";
import { TradeDrawer } from "@/components/TradeDrawer";

// Top app bar shared by every desktop page. Matches the desk-dashboard
// artboard's nav strip. The SearchInput is a client component that syncs
// to ?q; the Live indicator is a static stub until task 7 (realtime).
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-11 items-center gap-6 border-b border-border px-[18px]">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-green font-mono text-[12px] font-bold text-[#0a1a0d]">
            P
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-fg">
            PolyAnomalies
          </span>
          <span className="ml-1 font-mono text-[11px] text-fg-faint">v0.3</span>
        </Link>

        <nav className="ml-2 flex gap-0.5">
          <NavLink href="/" label="Live Feed" />
          <NavLink href="/alerts" label="Alerts" />
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <LiveStatus />
          <SearchInput />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <TradeDrawer />
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-[12.5px] text-fg-dim no-underline hover:bg-surface hover:text-fg"
    >
      {label}
    </Link>
  );
}
