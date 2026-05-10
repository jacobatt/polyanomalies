import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { SearchInput } from "@/components/SearchInput";
import { LiveStatus } from "@/components/LiveStatus";
import { TradeDrawer } from "@/components/TradeDrawer";

// Single Shell that swaps chrome by viewport. Above md: full top bar with
// nav + search + live indicator. Below md: compact top bar + bottom-tab
// nav, search disappears (the dashboard's filters take over). Trade drawer
// mounts at the root either way.
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Desktop top bar — md and up */}
      <header className="hidden h-11 items-center gap-6 border-b border-border px-[18px] md:flex">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Logo />
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
          <Suspense fallback={null}>
            <SearchInput />
          </Suspense>
        </div>
      </header>

      {/* Mobile top bar — below md */}
      <header className="flex h-11 items-center gap-2.5 border-b border-border px-3 md:hidden">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Logo />
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-fg">
            PolyAnomalies
          </span>
        </Link>
        <div className="ml-auto">
          <LiveStatus />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col pb-12 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab nav — below md */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-12 border-t border-border bg-bg md:hidden">
        <BottomTab href="/" label="Feed" />
        <BottomTab href="/alerts" label="Alerts" />
      </nav>

      <Suspense fallback={null}>
        <TradeDrawer />
      </Suspense>
    </div>
  );
}

function Logo() {
  return (
    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-green font-mono text-[12px] font-bold text-[#0a1a0d]">
      P
    </span>
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

function BottomTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-1 items-center justify-center text-[12.5px] text-fg-dim no-underline hover:text-fg"
    >
      {label}
    </Link>
  );
}
