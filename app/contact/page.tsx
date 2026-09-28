import { Clause, CompanyPage, companyMetadata } from "@/app/_seo/company-page";
import { COMPANY, SITE_NAME } from "@/lib/site";

export const metadata = companyMetadata(
  "/contact",
  "Contact Us",
  `Contact ${SITE_NAME} for support, billing, privacy or legal questions, and to report content that breaks our rules.`,
);

const mail = (address: string) => `[${address}](mailto:${address})`;

export default function ContactPage() {
  return (
    <CompanyPage title="Contact us" intro="We read every message. Pick the address that fits and we'll get back to you by email.">
      <Clause
        title="Support and billing"
        paragraphs={[
          `For help with your account, generations, charges or refunds, email ${mail(COMPANY.supportEmail)}. Include the email you sign in with and, for a specific video, the workspace name and roughly when you made it.`,
        ]}
      />
      <Clause
        title="Privacy requests"
        paragraphs={[
          `To access, correct, export or delete your personal data, email ${mail(COMPANY.privacyEmail)} from the address on your account. See our [Privacy Policy](/privacy) for details.`,
        ]}
      />
      <Clause
        title="Report abuse or copyright infringement"
        paragraphs={[
          `To report content that breaks our [Acceptable Use Policy](/acceptable-use), or to send a copyright notice, email ${mail(COMPANY.legalEmail)} with a link to or description of the content and why you're reporting it. We treat reports about minors, non-consensual content and impersonation as urgent.`,
        ]}
      />
      <Clause title="Company details" paragraphs={[`${COMPANY.legalName}`, `${COMPANY.address}`]} />
    </CompanyPage>
  );
}
