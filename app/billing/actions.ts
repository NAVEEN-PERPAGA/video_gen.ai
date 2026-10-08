"use server";

import { redirect } from "next/navigation";
import { apiFetch, errorMessages } from "@/lib/api";
import { checkoutItem, type Interval, parsePlanId, type Tier, TIERS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export type BillingActionState = { error?: string } | undefined;

const INTERVALS: readonly Interval[] = ["month", "year", "once"];

/**
 * Starts a Dodo checkout for a tier at an interval and sends the browser to
 * it. Credits are added by the API when Dodo confirms the payment (webhook),
 * not by coming back from checkout. Signed out: sign in first, then back to
 * the pricing page.
 */
export async function startCheckout(_: BillingActionState, formData: FormData): Promise<BillingActionState> {
  const tier = TIERS.find((t) => t.id === formData.get("tier"));
  const interval = INTERVALS.find((i) => i === formData.get("interval"));
  if (!tier || !interval) return { error: "Unknown plan." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect(`/login?next=${encodeURIComponent("/pricing")}`);

  let checkoutUrl: string;
  try {
    ({ checkoutUrl } = await apiFetch<{ checkoutUrl: string }>("/me/credits/checkout", {
      method: "POST",
      body: JSON.stringify(checkoutItem(tier.id, interval)),
    }));
  } catch (err) {
    return { error: errorMessages(err, "Could not start the checkout.").join(" ") };
  }
  // redirect() throws, so it stays outside the try.
  redirect(checkoutUrl);
}

/** The caller's spendable credits (USD), or null when signed out or the API can't be reached. */
export async function getAvailableCredits(): Promise<number | null> {
  try {
    return (await apiFetch<{ available: number }>("/me/credits")).available;
  } catch {
    return null;
  }
}

/** The caller's subscribed tier and interval, or null when signed out, not subscribed, or the API can't be reached. */
export async function getCurrentPlan(): Promise<{ tierId: Tier["id"]; interval: "month" | "year" } | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return null;
  try {
    const subscription = await apiFetch<{ planId: string } | null>("/me/credits/subscription");
    const parsed = subscription && parsePlanId(subscription.planId);
    return parsed ? { tierId: parsed.tier.id, interval: parsed.interval } : null;
  } catch {
    return null;
  }
}

/** Sends the browser to Dodo's customer portal: cancel or change the plan, update the card, invoices. */
export async function openBillingPortal(): Promise<BillingActionState> {
  let url: string;
  try {
    ({ url } = await apiFetch<{ url: string }>("/me/credits/portal", { method: "POST" }));
  } catch (err) {
    return { error: errorMessages(err, "Could not open the billing portal.").join(" ") };
  }
  redirect(url);
}
