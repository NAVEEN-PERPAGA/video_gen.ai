"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Re-renders the page every few seconds for about half a minute after a
 * checkout: the credits arrive with Dodo's webhook, usually a moment after
 * the browser comes back.
 */
export function RefreshWhilePending({ everyMs = 3000, times = 10 }: { everyMs?: number; times?: number }) {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const id = window.setInterval(() => {
      router.refresh();
      if (++count >= times) window.clearInterval(id);
    }, everyMs);
    return () => window.clearInterval(id);
  }, [router, everyMs, times]);
  return null;
}
