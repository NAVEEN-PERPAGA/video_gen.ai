import "server-only";
import { apiFetch, apiFetchPage } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

/** GET /me/credits (USD). */
export interface CreditBalance {
  balance: number;
  reserved: number;
  available: number;
}

/** GET /me/credits/subscription: the subscription that still bills. */
export interface Subscription {
  planId: string;
  interval: "month" | "year" | null;
  status: "pending" | "active" | "on_hold" | "paused" | "cancelled" | "failed" | "expired" | "past_due";
  nextBillingAt: string | null;
  cancelAtPeriodEnd: boolean;
}

/** GET /me/credits/transactions: one ledger row. */
export interface CreditTransaction {
  id: number;
  type: "topup" | "charge" | "refund" | "dispute" | "dispute_reversal" | "adjustment";
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export async function isSignedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims);
}

/** The signed-in user's subscription, or null (also when the API can't be reached: the page still renders). */
export async function getSubscription(): Promise<Subscription | null> {
  try {
    return await apiFetch<Subscription | null>("/me/credits/subscription");
  } catch (err) {
    console.error("Could not load the subscription.", err);
    return null;
  }
}

export async function getBalance(): Promise<CreditBalance> {
  return apiFetch<CreditBalance>("/me/credits");
}

export async function listRecentTransactions(limit = 20): Promise<CreditTransaction[]> {
  return (await apiFetchPage<CreditTransaction>("/me/credits/transactions", { limit })).items;
}
