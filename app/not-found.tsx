import Link from "next/link";
import { Shell } from "@/components/Shell";
import { EmptyState } from "@/components/States";

export default function NotFound() {
  return (
    <Shell>
      <EmptyState
        headline="Not found"
        sub="That market or wallet isn’t in the database — it may have been removed, or no scored trades exist for it yet."
        cta={
          <Link
            href="/"
            className="rounded-md bg-green px-3 py-1.5 text-[12px] font-semibold text-[#062a13] no-underline"
          >
            Back to dashboard
          </Link>
        }
      />
    </Shell>
  );
}
