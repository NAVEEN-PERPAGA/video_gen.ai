import { Clause, CompanyPage, companyMetadata, LEGAL_UPDATED } from "@/app/_seo/company-page";
import { COMPANY, SITE_NAME } from "@/lib/site";

export const metadata = companyMetadata(
  "/privacy",
  "Privacy Policy",
  `How ${SITE_NAME} collects, uses and protects your personal data, and the choices and rights you have.`,
);

/*
 * Keep this in step with the code: it describes Supabase auth (Google or
 * email sign-in), the node_scalable API, Runware as the model provider, and
 * sign-in cookies only. Adding analytics, ads, payments or another provider
 * means updating the relevant sections (and LEGAL_UPDATED).
 */
const mail = (address: string) => `[${address}](mailto:${address})`;

export default function PrivacyPage() {
  return (
    <CompanyPage
      title="Privacy Policy"
      updated={LEGAL_UPDATED}
      intro={`This policy explains how ${COMPANY.legalName} (“${SITE_NAME}”, “we”, “us”) handles personal data when you use our website and AI video tools (the “Service”). We collect only what we need to run the Service, and we never sell your personal data.`}
    >
      <Clause
        title="1. Who we are"
        paragraphs={[
          `${COMPANY.legalName}, ${COMPANY.address}, is the controller of your personal data. For any privacy question, email ${mail(COMPANY.privacyEmail)}.`,
        ]}
      />
      <Clause
        title="2. Information we collect"
        bullets={[
          "Account information: your email address and, if you sign in with Google, your name and profile photo from your Google account. If you sign up with a password, it's handled by our authentication provider and stored only in hashed form; we never see it.",
          "Workspace information: the workspaces you create or join, their names, and your role in each.",
          "Content you provide: prompts, uploaded images, links to audio, video, documents or web pages you attach, and the settings you choose for each generation.",
          "Generated content: the videos the Service creates for you, with details such as the model used, status, cost and time created.",
          "Technical information: sign-in cookies, and the IP address, browser and device information that our servers and hosting providers record in logs to run and secure the Service.",
          "Communications: what you send us when you email support or report content.",
        ]}
      />
      <Clause
        title="3. How we use it"
        bullets={[
          "To provide the Service: create your account, run your generations, and show your videos in your workspaces.",
          "To keep the Service secure: prevent fraud and abuse, and enforce our [Terms of Service](/terms) and [Acceptable Use Policy](/acceptable-use).",
          "To support you and send important service messages, such as changes to these policies.",
          "To understand and improve how the Service performs.",
          "To comply with the law and respond to lawful requests.",
        ]}
        after={[
          "We do not sell or rent your personal data, we do not use it for targeted advertising, and we do not use your prompts, uploads or videos to train AI models.",
        ]}
      />
      <Clause
        title="4. Legal bases (EEA and UK users)"
        paragraphs={[
          "We process your data to perform our contract with you (running the Service), for our legitimate interests (security, abuse prevention and improving the Service, balanced against your rights), to comply with legal obligations, and with your consent where the law requires it. You can withdraw consent at any time.",
        ]}
      />
      <Clause
        title="5. Who we share it with"
        paragraphs={["We share personal data only as needed to run the Service:"]}
        bullets={[
          "Authentication and database providers (Supabase), which store your account and sign-in sessions.",
          "Google, if you choose to sign in with Google.",
          "AI model providers: when you generate a video, your prompt, attachments and settings are sent to Runware and, for models run by their developer, to that developer (for example ByteDance, Alibaba, Google, Lightricks, MiniMax, Black Forest Labs or xAI), only to create the video.",
          "Hosting and infrastructure providers that run our website and servers.",
          "Other members of a workspace, who can see the videos, prompts and settings created in it.",
          "Authorities or other parties when required by law, or to protect the rights, safety and property of our users, the public or us.",
          "A buyer or successor, if we're involved in a merger, acquisition or sale of assets, subject to this policy.",
        ]}
        after={[
          "Our providers may process data only on our instructions and must protect it. Some model providers apply their own safety checks to the content sent to them.",
        ]}
      />
      <Clause
        title="6. International transfers"
        paragraphs={[
          "Our providers may process data in countries other than yours, including the United States. Where the law requires it, we rely on appropriate safeguards such as Standard Contractual Clauses.",
        ]}
      />
      <Clause
        title="7. How long we keep it"
        paragraphs={[
          "We keep your account and workspace information for as long as your account is open. We keep your generations until you ask us to delete them or close your account. Server logs are kept for a limited time for security and troubleshooting. We may keep some data longer where the law requires it, or to resolve disputes and enforce our agreements.",
        ]}
      />
      <Clause
        title="8. Your rights"
        paragraphs={[
          "Depending on where you live (for example under the GDPR, the UK GDPR, California law, or India's Digital Personal Data Protection Act), you may have the right to:",
        ]}
        bullets={[
          "access the personal data we hold about you and get a copy of it;",
          "correct inaccurate data;",
          "delete your data or close your account;",
          "object to, or ask us to restrict, certain processing;",
          "withdraw consent where we rely on it;",
          "complain to your local data protection authority.",
        ]}
        after={[
          `To use any of these rights, email ${mail(COMPANY.privacyEmail)} from the address on your account. We'll respond within the time the law allows and won't treat you differently for exercising your rights.`,
        ]}
      />
      <Clause
        title="9. Cookies"
        paragraphs={[
          "We use only essential cookies: the ones that keep you signed in and your session secure. We don't use advertising or third-party tracking cookies. Because these cookies are strictly necessary for the Service to work, they don't require consent in most places. If that changes, we'll update this policy and ask for your consent where required.",
        ]}
      />
      <Clause
        title="10. Security"
        paragraphs={[
          "We use encryption in transit, access controls and reputable infrastructure providers to protect your data. No online service can be completely secure, so please use a strong, unique password or sign in with Google, and tell us straight away if you suspect unauthorised access to your account.",
        ]}
      />
      <Clause
        title="11. Children"
        paragraphs={[
          `The Service is not for anyone under ${COMPANY.minimumAge}. We don't knowingly collect personal data from children. If you believe a child has given us personal data, contact us and we'll delete it.`,
        ]}
      />
      <Clause
        title="12. Changes to this policy"
        paragraphs={[
          "We may update this policy from time to time. We'll change the “Last updated” date above and, for significant changes, let you know by email or in the Service before they take effect.",
        ]}
      />
      <Clause
        title="13. Contact"
        paragraphs={[`${COMPANY.legalName}, ${COMPANY.address}. Email: ${mail(COMPANY.privacyEmail)}.`]}
      />
    </CompanyPage>
  );
}
