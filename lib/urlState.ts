"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** Read + write URL search params without scroll, deleting empty values. */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const sp = new URLSearchParams(params.toString());
      if (value == null || value === "") sp.delete(key);
      else sp.set(key, value);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { params, setParam };
}
