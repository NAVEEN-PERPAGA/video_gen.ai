import { Clause, CompanyPage, companyMetadata, LEGAL_UPDATED } from "@/app/_seo/company-page";
import { COMPANY, SITE_NAME } from "@/lib/site";

export const metadata = companyMetadata(
  "/terms",
  "Terms of Service",
  `The terms that govern your use of ${SITE_NAME}'s AI video generation and editing tools.`,
);

const mail = (address: string) => `[${address}](mailto:${address})`;

export default function TermsPage() {
  return (
    <CompanyPage
      title="Terms of Service"
      updated={LEGAL_UPDATED}
      intro={`These Terms of Service (“Terms”) are an agreement between you and ${COMPANY.legalName} (“${SITE_NAME}”, “we”, “us”) and govern your use of our website and AI video tools (the “Service”). By creating an account or using the Service, you agree to these Terms, our [Privacy Policy](/privacy) and our [Acceptable Use Policy](/acceptable-use).`}
    >
      <Clause
        title="1. Eligibility"
        paragraphs={[
          `You must be at least ${COMPANY.minimumAge} years old, or the age of majority where you live if that is higher, to use the Service. If you use the Service for an organisation, you confirm that you have authority to accept these Terms for it, and “you” includes that organisation.`,
        ]}
      />
      <Clause
        title="2. Your account and workspaces"
        paragraphs={[
          "You're responsible for your account, for keeping your sign-in details secure, and for everything that happens under your account. Workspace owners and admins control who can join a workspace and can see, and may manage, the content created in it. Tell us straight away if you suspect unauthorised use of your account.",
        ]}
      />
      <Clause
        title="3. The Service and AI models"
        paragraphs={[
          "The Service lets you generate and edit videos using AI models built and operated by third parties (such as ByteDance, Alibaba, Google, Lightricks, MiniMax, Black Forest Labs and xAI) through providers such as Runware. We may add, change or remove models and features at any time.",
          "AI output is generated automatically and can be unexpected, inaccurate or imperfect. The same prompt may produce different results, and other users may receive similar results. Review every output before you rely on or publish it.",
        ]}
      />
      <Clause
        title="4. Pricing and payment"
        paragraphs={[
          "Creating an account is free. Generating videos may incur charges, which depend on the model, length, resolution and settings you choose. Before each generation, the Service shows an estimated cost. Some providers bill by usage, so the final charge can differ slightly from the estimate. If you buy a plan or credits, the price, billing terms and any usage limits are shown at purchase. Prices exclude applicable taxes unless stated otherwise.",
          "Refunds are covered by our [Refund Policy](/refund-policy). We may change our prices with notice. Changes don't affect charges for generations you've already started.",
        ]}
      />
      <Clause
        title="5. Your content"
        paragraphs={[
          "You keep ownership of the prompts, images, audio, video and other material you provide (your “Inputs”). You give us a worldwide, non-exclusive licence to host, copy, process and transmit your Inputs, including sending them to model providers, only to operate, secure and provide the Service to you.",
          "You confirm that you own or have all necessary rights and permissions for your Inputs, including the consent of any identifiable person who appears in them, and that your Inputs and your use of the Service don't break any law or anyone's rights.",
        ]}
      />
      <Clause
        title="6. Generated videos"
        paragraphs={[
          "As between you and us, and to the extent the law allows, you own the videos you generate (your “Outputs”) and may use them for any lawful purpose, including commercially, subject to these Terms and any terms of the model provider that apply to that model. We don't claim ownership of your Outputs, and we don't use your Inputs or Outputs to train AI models.",
          "AI-generated material may not be protected by copyright in some countries, and similar Outputs may be generated for others. You are responsible for how you use your Outputs, including labelling them as AI-generated where the law or a platform requires it.",
        ]}
      />
      <Clause
        title="7. Acceptable use"
        paragraphs={[
          "You must follow our [Acceptable Use Policy](/acceptable-use). You must not misuse the Service. For example, you must not break the law, infringe others' rights, create deceptive deepfakes or non-consensual content, try to get around safety systems or usage limits, interfere with the Service, or access it by automated means except through features we provide for that.",
        ]}
      />
      <Clause
        title="8. Copyright complaints"
        paragraphs={[
          `We respect intellectual property rights. If you believe content on the Service infringes your copyright, send a notice to ${mail(COMPANY.supportEmail)} that includes: your contact details; a description of the copyrighted work; the location of the infringing material; a statement that you believe in good faith the use is not authorised; a statement, under penalty of perjury, that your notice is accurate and that you are the owner or authorised to act for the owner; and your physical or electronic signature. We may remove the content and close the accounts of repeat infringers.`,
        ]}
      />
      <Clause
        title="9. Third-party services"
        paragraphs={[
          "The Service relies on third-party services such as sign-in providers, hosting and AI model providers. Their availability and terms are outside our control, and we aren't responsible for them. Links to other websites are provided for convenience only.",
        ]}
      />
      <Clause
        title="10. Our intellectual property"
        paragraphs={[
          `The Service, including its software, design and branding, belongs to ${COMPANY.legalName} and its licensors. These Terms don't grant you any right to our trademarks or to the Service other than the right to use it as these Terms allow. If you send us feedback, we may use it without any obligation to you.`,
        ]}
      />
      <Clause
        title="11. Suspension and termination"
        paragraphs={[
          "You can stop using the Service and ask us to close your account at any time. We may suspend or end your access, or remove content, if you break these Terms, if we need to in order to protect users, the Service or others, or if the law requires it. Where reasonable, we'll tell you and give you a chance to download your content first. Sections that by their nature should survive termination will survive.",
        ]}
      />
      <Clause
        title="12. Disclaimers"
        paragraphs={[
          "The Service and all Outputs are provided “as is” and “as available”. To the fullest extent the law allows, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, and that the Service will be uninterrupted, error-free or that Outputs will be accurate or meet your expectations.",
        ]}
      />
      <Clause
        title="13. Limitation of liability"
        paragraphs={[
          "To the fullest extent the law allows, we won't be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of profits, revenue, data or goodwill. Our total liability for all claims relating to the Service is limited to the greater of the amount you paid us in the 12 months before the claim, or USD 100. Nothing in these Terms limits liability that cannot be limited by law.",
        ]}
      />
      <Clause
        title="14. Indemnity"
        paragraphs={[
          "You agree to defend and indemnify us against claims, damages, losses and expenses (including reasonable legal fees) arising from your Inputs, your use of Outputs, or your breach of these Terms or the law.",
        ]}
      />
      <Clause
        title="15. Governing law and disputes"
        paragraphs={[
          `These Terms are governed by the laws of ${COMPANY.governingLaw}, without regard to its conflict-of-law rules. The courts of ${COMPANY.governingLaw} have exclusive jurisdiction over any dispute, unless the law where you live as a consumer gives you the right to bring proceedings there. Before starting any proceedings, please contact us so we can try to resolve the issue informally.`,
        ]}
      />
      <Clause
        title="16. Changes to these Terms"
        paragraphs={[
          "We may update these Terms. We'll change the “Last updated” date above and, for material changes, notify you by email or in the Service before they take effect. If you keep using the Service after changes take effect, you accept the updated Terms.",
        ]}
      />
      <Clause
        title="17. General"
        paragraphs={[
          "These Terms, together with the policies they refer to, are the entire agreement between you and us about the Service. If any part is found unenforceable, the rest stays in effect. Our failure to enforce a provision isn't a waiver. You may not transfer these Terms without our consent; we may transfer them as part of a merger, acquisition or sale of assets.",
        ]}
      />
      <Clause
        title="18. Contact"
        paragraphs={[`${COMPANY.legalName}, ${COMPANY.address}. Email: ${mail(COMPANY.supportEmail)}.`]}
      />
    </CompanyPage>
  );
}
