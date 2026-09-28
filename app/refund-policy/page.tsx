import { Clause, CompanyPage, companyMetadata, LEGAL_UPDATED } from "@/app/_seo/company-page";
import { COMPANY, SITE_NAME } from "@/lib/site";

export const metadata = companyMetadata(
  "/refund-policy",
  "Refund Policy",
  `When ${SITE_NAME} refunds or credits charges for AI video generations, plans and credits, and how to ask for one.`,
);

/*
 * These are commitments to customers: confirm each one matches how billing
 * actually works (failed-generation credits, the 14-day window) before launch.
 */
const mail = (address: string) => `[${address}](mailto:${address})`;

export default function RefundPolicyPage() {
  return (
    <CompanyPage
      title="Refund Policy"
      updated={LEGAL_UPDATED}
      intro={`Every AI video generation uses paid computing time from model providers the moment it runs, so we can't take a finished video back. This policy explains when we refund or credit charges. It is part of our [Terms of Service](/terms).`}
    >
      <Clause
        title="1. Check the cost before you generate"
        paragraphs={[
          "The Service shows an estimated cost for your exact model and settings before each generation. Please check it, and consider drafting on faster, lower-cost models before rendering a final version.",
        ]}
      />
      <Clause
        title="2. Failed generations"
        paragraphs={[
          "If a generation fails because of a technical error on our side or the model provider's, and no video is delivered, you won't be charged for it. If a charge was taken, we'll credit it back to your account or refund it.",
        ]}
      />
      <Clause
        title="3. Completed generations"
        paragraphs={[
          "Generations that complete and deliver a video are not refundable, including when the result doesn't match what you had in mind. AI output varies, and the compute cost has already been paid. If a video is clearly broken (for example corrupt, blank or cut short by a technical fault), contact us within 14 days and we'll review it and credit you where appropriate.",
        ]}
      />
      <Clause
        title="4. Plans and credit purchases"
        paragraphs={[
          "If you buy a plan or a pack of credits and haven't used any of it, you can ask for a full refund within 14 days of purchase. Partly used purchases aren't refundable, except where the law requires it. Cancelling a subscription stops future renewals, and you keep access until the end of the current billing period.",
        ]}
      />
      <Clause
        title="5. Content refused for safety reasons"
        paragraphs={[
          "Generations blocked by a model provider's safety systems are treated as failed generations. Accounts closed for breaking our [Acceptable Use Policy](/acceptable-use) are not eligible for refunds.",
        ]}
      />
      <Clause
        title="6. How to ask for a refund"
        paragraphs={[
          `Email ${mail(COMPANY.supportEmail)} from the address on your account with the date of the charge and, for a specific generation, the workspace and roughly when you made it. Approved refunds go back to your original payment method, usually within 5 to 10 business days depending on your bank.`,
        ]}
      />
      <Clause
        title="7. Your statutory rights"
        paragraphs={[
          "Nothing in this policy affects rights you have under consumer protection law where you live. If you're a consumer in the EU or UK, you agree when you generate a video that the service starts immediately, and you acknowledge that you lose your right of withdrawal for that generation once it's delivered.",
        ]}
      />
    </CompanyPage>
  );
}
