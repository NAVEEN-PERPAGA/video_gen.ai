import { PlainHeader } from "@/app/_seo/article";
import { companyMetadata } from "@/app/_seo/company-page";
import { type Faq, faqPageLd, JsonLd } from "@/app/_seo/json-ld";
import { FaqList, Section } from "@/app/_seo/sections";
import { getSubscription, isSignedIn } from "@/app/billing/data";
import { SiteFooter } from "@/app/site-footer";
import { parsePlanId, TIERS } from "@/lib/plans";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { type CurrentPlan, PlanPicker } from "./plan-picker";

export const metadata = companyMetadata(
  "/pricing",
  "Pricing: AI Video & Image Generator Plans",
  `${SITE_NAME} plans from $9 a month: credits for every leading AI video and image model. Save up to 56% yearly, or buy credits once with no subscription.`,
);

const FAQS: Faq[] = [
  {
    q: "How do credits work?",
    a: "Credits are dollars in your account. Each generation uses credits based on the model, length, resolution and settings you choose, and the estimated cost is shown before you generate. If a generation fails, you aren't charged.",
  },
  {
    q: "What's the difference between monthly, yearly and one-time?",
    a: "Monthly plans add the plan's credits every month. Yearly plans add all 12 months of credits at once, at a lower price. One-time purchases add one month's worth of credits with no subscription.",
  },
  {
    q: "Do unused credits expire?",
    a: "No. Unused credits stay in your account and roll over, including after you cancel.",
  },
  {
    q: "Can I cancel or change my plan?",
    a: "Yes. Open [Billing](/billing) and choose Manage subscription to cancel, switch plans or update your card. A cancelled plan stops renewing at the end of the period you've paid for.",
  },
  {
    q: "Can I get a refund?",
    a: "Unused purchases can be refunded within 14 days. See our [Refund Policy](/refund-policy) for the details.",
  },
];

export default async function PricingPage() {
  const signedIn = await isSignedIn();
  const subscription = signedIn ? await getSubscription() : null;
  const parsed = subscription && parsePlanId(subscription.planId);
  const current: CurrentPlan | null = parsed ? { tierId: parsed.tier.id, interval: parsed.interval } : null;

  return (
    <>
      <PlainHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${SITE_NAME} credits`,
          url: absoluteUrl("/pricing"),
          offers: TIERS.map((t) => ({
            "@type": "Offer",
            name: `${t.name} monthly`,
            price: t.price.month,
            priceCurrency: "USD",
          })),
        }}
      />
      <JsonLd data={faqPageLd(FAQS)} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 pt-12 pb-20">
        <header className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple pricing for every model</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Pick a plan for monthly credits, save with yearly billing, or buy credits once. Every plan works with
            every image and video model, and you see the cost before each generation.
          </p>
        </header>

        <PlanPicker current={current} />

        <div className="mx-auto w-full max-w-3xl">
          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>
        </div>
      </main>
      <SiteFooter className="pb-12" />
    </>
  );
}
