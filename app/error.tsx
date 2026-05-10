"use client";

import { Shell } from "@/components/Shell";
import { ErrorState } from "@/components/States";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Shell>
      <ErrorState message={error.message} onRetry={reset} />
    </Shell>
  );
}
