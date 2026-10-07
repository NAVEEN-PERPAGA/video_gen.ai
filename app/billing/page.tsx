import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PlainHeader } from "@/app/_seo/article";
import { PortalButton } from "@/app/pricing/plan-picker";
import { GoogleSignInButton } from "@/app/google-sign-in-button";
import { SiteFooter } from "@/app/site-footer";
import { errorMessages } from "@/lib/api";
import { formatUsd, parsePlanId } from "@/lib/plans";
import {
  type CreditBalance,
  type CreditTransaction,
  getBalance,
  getSubscription,
  isSignedIn,
  listRecentTransactions,
  type Subscription,
} from "./data";
import { RefreshWhilePending } from "./refresh-while-pending";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false },
};

const STATUS_LABELS: Record<Subscription["status"], string> = {
  pending: "Starting",
  active: "Active",
  on_hold: "Payment failed: update your card",
  paused: "Paused",
  cancelled: "Cancelled",
  failed: "Failed",
  expired: "Expired",
  past_due: "Payment overdue: update your card",
};

const SECONDARY =
  "flex h-10 cursor-pointer items-center justify-center rounded-md border border-black/10 px-4 text-sm font-medium transition hover:border-black/25 dark:border-white/15 dark:hover:border-white/30";

/**
 * The wallet, the subscription and recent credit activity. Also where Dodo
 * sends the browser back after checkout (`?status=...`): the credits arrive
 * by webhook, so the page refreshes itself for a little while.
 */
export default async function BillingPage({ searchParams }: PageProps<"/billing">) {
  const { status } = await searchParams;
  const returned = typeof status === "string" ? status : null;
  const paymentFailed = returned !== null && /fail|cancel/i.test(returned);

  if (!(await isSignedIn())) {
    return (
      <Frame>
        <div className="flex flex-col items-start gap-4 rounded-xl border border-black/10 p-6 dark:border-white/15">
          <p>Sign in to see your credits and subscription.</p>
          <GoogleSignInButton next="/billing" />
        </div>
      </Frame>
    );
  }

  let balance: CreditBalance | null = null;
  let transactions: CreditTransaction[] = [];
  let loadError: string | null = null;
  try {
    [balance, transactions] = await Promise.all([getBalance(), listRecentTransactions()]);
  } catch (err) {
    loadError = errorMessages(err, "Could not load your credits.").join(" ");
  }
  const subscription = await getSubscription();

  return (
    <Frame>
      {returned && !paymentFailed && (
        <>
          <RefreshWhilePending />
          <Notice tone="success">
            Thanks! Your payment went through. Credits appear here within a few seconds.
          </Notice>
        </>
      )}
      {paymentFailed && (
        <Notice tone="error">
          The payment didn&apos;t go through, so you weren&apos;t charged.{" "}
          <Link href="/pricing" className="underline underline-offset-2">
            Try again
          </Link>
          .
        </Notice>
      )}
      {loadError && <Notice tone="error">{loadError}</Notice>}

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Credits">
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {balance ? formatMoney(balance.available) : "–"}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {balance && balance.reserved > 0
              ? `Available. ${formatMoney(balance.reserved)} is held by generations in progress.`
              : "Available to spend on any model. Credits never expire."}
          </p>
          <Link
            href="/pricing"
            className="mt-auto flex h-10 items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            Buy credits
          </Link>
        </Card>

        <Card title="Subscription">
          <SubscriptionSummary subscription={subscription} />
          <div className="mt-auto">
            {subscription ? (
              <PortalButton label="Manage subscription" className={`${SECONDARY} w-full`} />
            ) : (
              <Link href="/pricing" className={SECONDARY}>
                See plans
              </Link>
            )}
          </div>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        {transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
            No credit activity yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-600 dark:text-zinc-400">
                <tr className="border-b border-black/10 dark:border-white/15">
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/15">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">{t.description ?? t.type}</td>
                    <td
                      className={`whitespace-nowrap px-4 py-2.5 text-right tabular-nums ${
                        t.amount > 0 ? "text-emerald-700 dark:text-emerald-300" : ""
                      }`}
                    >
                      {t.amount > 0 ? "+" : "−"}
                      {formatMoney(Math.abs(t.amount))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                      {formatMoney(t.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Frame>
  );
}

function SubscriptionSummary({ subscription }: { subscription: Subscription | null }) {
  if (!subscription) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No subscription. Subscribe for monthly credits at a lower price, or buy credits once.
      </p>
    );
  }
  const plan = parsePlanId(subscription.planId);
  const name = plan
    ? `${plan.tier.name} ${plan.interval === "month" ? "Monthly" : "Yearly"}`
    : subscription.planId;
  const date = subscription.nextBillingAt && formatDate(subscription.nextBillingAt);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-2xl font-semibold tracking-tight">{name}</p>
      {plan && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatUsd(plan.tier.price[plan.interval])} / {plan.interval} ·{" "}
          {formatUsd(plan.interval === "year" ? plan.tier.monthlyCredits * 12 : plan.tier.monthlyCredits)} in
          credits each {plan.interval}
        </p>
      )}
      <p className="text-sm">
        {STATUS_LABELS[subscription.status]}
        {date && (subscription.cancelAtPeriodEnd ? ` · Ends ${date}` : ` · Renews ${date}`)}
      </p>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <>
      <PlainHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pt-10 pb-20">
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        {children}
      </main>
      <SiteFooter className="pb-12" />
    </>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-black/10 p-6 dark:border-white/15">
      <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</h2>
      {children}
    </section>
  );
}

function Notice({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return (
    <p
      role="status"
      className={`rounded-md border p-4 text-sm ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300"
      }`}
    >
      {children}
    </p>
  );
}

/** Two decimals, since generations cost cents (and the balance can dip just below zero). */
function formatMoney(n: number) {
  return `${n < 0 ? "−" : ""}$${Math.abs(n).toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" });
}
