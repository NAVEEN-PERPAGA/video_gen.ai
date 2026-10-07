/**
 * What the pricing page sells. The ids are the API's (node_scalable
 * CREDIT_PLANS / CREDIT_PACKS), which map them to Dodo product ids and decide
 * the credits actually granted: keep the prices and credits here in step
 * with the Dodo dashboard and the API's config.
 *
 * Every tier adds its monthly price in credits (USD) to the wallet per month:
 * a monthly plan each month, a yearly plan 12 months up front, a one-time
 * pack once. Credits never expire.
 */
export type Interval = "month" | "year" | "once";

export interface Tier {
  id: "lite" | "pro" | "premium";
  name: string;
  tagline: string;
  /** Credits (USD) per month of the plan. */
  monthlyCredits: number;
  /** What each option costs, in USD. */
  price: Record<Interval, number>;
  highlight?: boolean;
}

export const TIERS: readonly Tier[] = [
  {
    id: "lite",
    name: "Lite",
    tagline: "For trying models and the occasional clip.",
    monthlyCredits: 9,
    price: { month: 9, year: 48, once: 9 },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For creators publishing every week.",
    monthlyCredits: 19,
    price: { month: 19, year: 108, once: 19 },
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For teams and high-resolution, long-form work.",
    monthlyCredits: 49,
    price: { month: 49, year: 276, once: 49 },
  },
];

/** What the checkout endpoint takes for a tier at an interval. */
export function checkoutItem(tier: Tier["id"], interval: Interval): { planId: string } | { packId: string } {
  if (interval === "once") return { packId: tier };
  return { planId: `${tier}-${interval === "month" ? "monthly" : "yearly"}` };
}

/** The tier and interval of an API plan id ("pro-yearly"), if it's one of ours. */
export function parsePlanId(planId: string): { tier: Tier; interval: "month" | "year" } | null {
  const match = /^(lite|pro|premium)-(monthly|yearly)$/.exec(planId);
  const tier = match && TIERS.find((t) => t.id === match[1]);
  return tier ? { tier, interval: match[2] === "monthly" ? "month" : "year" } : null;
}

/** Credits one purchase adds: a year's worth for a yearly plan. */
export function creditsFor(tier: Tier, interval: Interval) {
  return interval === "year" ? tier.monthlyCredits * 12 : tier.monthlyCredits;
}

/** How much cheaper a year is than 12 monthly payments, as a whole percentage. */
export function yearlySavings(tier: Tier) {
  return Math.round((1 - tier.price.year / (tier.price.month * 12)) * 100);
}

export function formatUsd(n: number) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}
