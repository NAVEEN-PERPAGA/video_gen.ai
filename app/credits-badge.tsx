"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAvailableCredits } from "@/app/billing/actions";
import { CREDITS_CHANGED } from "@/lib/credits-events";

/** Below this (USD), the badge turns amber to nudge a top-up. */
const LOW_BALANCE = 0.5;

/**
 * The signed-in user's available credits, next to the avatar; links to
 * Billing. Refetches when a generation starts or finishes (CREDITS_CHANGED)
 * and when the tab regains focus (e.g. back from checkout).
 */
export function CreditsBadge({ initial }: { initial: number | null }) {
  const [available, setAvailable] = useState(initial);

  useEffect(() => {
    let latest = 0;
    const refresh = async () => {
      // Only the newest request may set the value, so a slow early answer can't overwrite a newer one.
      const request = ++latest;
      const value = await getAvailableCredits();
      if (request === latest && value !== null) setAvailable(value);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener(CREDITS_CHANGED, refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(CREDITS_CHANGED, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (available === null) return null;
  const low = available < LOW_BALANCE;
  return (
    <Link
      href="/billing"
      title={low ? "Low on credits: top up on the Billing page" : "Available credits"}
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium tabular-nums transition ${
        low
          ? "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:border-amber-500/70 dark:text-amber-300"
          : "border-black/10 text-zinc-700 hover:border-black/25 hover:text-foreground dark:border-white/15 dark:text-zinc-300 dark:hover:border-white/30"
      }`}
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true" className="size-4">
        <ellipse cx="10" cy="6" rx="6" ry="2.5" />
        <path d="M4 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6M4 10v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4" />
      </svg>
      <span className="sr-only">Credits: </span>
      {available < 0 ? "−" : ""}${Math.abs(available).toFixed(2)}
    </Link>
  );
}
