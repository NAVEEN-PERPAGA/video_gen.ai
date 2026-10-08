"use client";

import { type ReactNode, useActionState, useEffect, useState } from "react";
import { type BillingActionState, getCurrentPlan, openBillingPortal, startCheckout } from "@/app/billing/actions";
import { creditsFor, formatUsd, type Interval, type Tier, TIERS, yearlySavings } from "@/lib/plans";

export interface CurrentPlan {
  tierId: Tier["id"];
  interval: "month" | "year";
}

const INTERVAL_TABS: { id: Interval; label: string }[] = [
  { id: "month", label: "Monthly" },
  { id: "year", label: "Yearly" },
  { id: "once", label: "One-time" },
];

const BEST_SAVINGS = Math.max(...TIERS.map(yearlySavings));

/**
 * Billing interval switch and the three tier cards. The page is static, so
 * the signed-in user's current plan is fetched after it loads.
 */
export function PlanPicker() {
  const [current, setCurrent] = useState<CurrentPlan | null>(null);
  const [interval, setBillingInterval] = useState<Interval>("month");

  useEffect(() => {
    let cancelled = false;
    getCurrentPlan().then((plan) => {
      if (cancelled || !plan) return;
      setCurrent(plan);
      setBillingInterval(plan.interval);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-10">
      <div
        role="radiogroup"
        aria-label="Billing"
        className="inline-flex rounded-lg border border-black/10 bg-black/[0.03] p-1 dark:border-white/15 dark:bg-white/[0.04]"
      >
        {INTERVAL_TABS.map((tab) => {
          const selected = tab.id === interval;
          return (
            <button
              key={tab.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setBillingInterval(tab.id)}
              className={`flex h-9 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium transition sm:px-4 ${
                selected
                  ? "bg-background text-foreground shadow-sm dark:bg-white/10"
                  : "text-zinc-600 hover:text-foreground dark:text-zinc-400"
              }`}
            >
              {tab.label}
              {tab.id === "year" && (
                <span className="rounded bg-emerald-600/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                  -{BEST_SAVINGS}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid w-full gap-6 md:grid-cols-3">
        {TIERS.map((tier) => (
          <PlanCard key={tier.id} tier={tier} interval={interval} current={current} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ tier, interval, current }: { tier: Tier; interval: Interval; current: CurrentPlan | null }) {
  const price = tier.price[interval];
  const credits = creditsFor(tier, interval);
  const isCurrent = current?.tierId === tier.id && current.interval === interval;
  // One subscription at a time: switching plans goes through Dodo's portal.
  const changesPlan = current !== null && interval !== "once" && !isCurrent;

  return (
    <section
      aria-labelledby={`tier-${tier.id}`}
      className={`relative flex flex-col gap-6 rounded-2xl border p-6 ${
        tier.highlight
          ? "border-indigo-600 shadow-lg shadow-indigo-600/10 dark:border-indigo-400"
          : "border-black/10 dark:border-white/15"
      }`}
    >
      {tier.highlight && (
        <p className="absolute -top-3 left-6 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-indigo-500">
          Most popular
        </p>
      )}

      <header className="flex flex-col gap-1.5">
        <h2 id={`tier-${tier.id}`} className="text-lg font-semibold">
          {tier.name}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{tier.tagline}</p>
      </header>

      <div className="flex flex-col gap-1">
        <p className="flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">
            {formatUsd(interval === "year" ? price / 12 : price)}
          </span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {interval === "once" ? "one time" : "/ month"}
          </span>
        </p>
        <p className="h-5 text-sm text-zinc-600 dark:text-zinc-400">
          {interval === "year" && (
            <>
              Billed {formatUsd(price)} yearly ·{" "}
              <span className="font-medium text-emerald-700 dark:text-emerald-300">save {yearlySavings(tier)}%</span>
            </>
          )}
          {interval === "month" && "Billed monthly"}
          {interval === "once" && "No subscription"}
        </p>
      </div>

      <ul className="flex flex-1 flex-col gap-2.5 text-sm">
        <Feature>
          <strong className="font-semibold">{formatUsd(credits)} in credits</strong>{" "}
          {interval === "month" && "every month"}
          {interval === "year" && `up front (${formatUsd(tier.monthlyCredits)} × 12 months)`}
          {interval === "once" && "to use any time"}
        </Feature>
        <Feature>Every image and video model</Feature>
        <Feature>See the cost before each generation</Feature>
        <Feature>Credits never expire</Feature>
        <Feature>{interval === "once" ? "Top up again whenever you like" : "Cancel anytime"}</Feature>
      </ul>

      {isCurrent ? (
        <p className="flex h-10 items-center justify-center rounded-md border border-black/10 text-sm font-medium text-zinc-600 dark:border-white/15 dark:text-zinc-400">
          Your current plan
        </p>
      ) : changesPlan ? (
        <PortalButton label="Change plan" />
      ) : (
        <CheckoutButton tier={tier} interval={interval} />
      )}
    </section>
  );
}

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-400"
      >
        <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

const PRIMARY =
  "flex h-10 w-full cursor-pointer items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-70";

function CheckoutButton({ tier, interval }: { tier: Tier; interval: Interval }) {
  const [state, action, pending] = useActionState<BillingActionState, FormData>(startCheckout, undefined);
  const label = interval === "once" ? `Buy ${tier.name}` : `Get ${tier.name}`;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="tier" value={tier.id} />
      <input type="hidden" name="interval" value={interval} />
      <button type="submit" disabled={pending} className={PRIMARY}>
        {pending ? "Opening checkout…" : label}
      </button>
      <ActionError state={state} />
    </form>
  );
}

export function PortalButton({ label, className = PRIMARY }: { label: string; className?: string }) {
  const [state, action, pending] = useActionState<BillingActionState, FormData>(openBillingPortal, undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <button type="submit" disabled={pending} className={className}>
        {pending ? "Opening…" : label}
      </button>
      <ActionError state={state} />
    </form>
  );
}

function ActionError({ state }: { state: BillingActionState }) {
  if (!state?.error) return null;
  return (
    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
      {state.error}
    </p>
  );
}
