import { Clause, CompanyPage, companyMetadata, LEGAL_UPDATED } from "@/app/_seo/company-page";
import { COMPANY, SITE_NAME } from "@/lib/site";

export const metadata = companyMetadata(
  "/acceptable-use",
  "Acceptable Use Policy",
  `What you can and can't create with ${SITE_NAME}: our rules for safe, lawful and honest AI video.`,
);

const mail = (address: string) => `[${address}](mailto:${address})`;

export default function AcceptableUsePage() {
  return (
    <CompanyPage
      title="Acceptable Use Policy"
      updated={LEGAL_UPDATED}
      intro={`AI video is a powerful creative tool, and realistic video can also deceive or harm people. This policy sets out what you may not do with ${SITE_NAME}. It is part of our [Terms of Service](/terms) and applies to your prompts, uploads and the videos you generate, share or publish.`}
    >
      <Clause
        title="1. Protecting children"
        paragraphs={[
          "Never create, upload or request any sexual or sexualised content involving minors, or content that sexualises childlike characters. We have zero tolerance for this: we will close the account immediately and report it to the relevant authorities, such as the National Center for Missing & Exploited Children.",
        ]}
      />
      <Clause
        title="2. Real people, consent and deepfakes"
        bullets={[
          "Don't create sexual or intimate content depicting a real person, and don't create nude or sexual content from anyone's photo.",
          "Don't use a real person's face, body or voice without their consent in a way that could mislead viewers, damage their reputation or harass them.",
          "Don't impersonate a real person, company or public body, or present AI-generated video of real people as authentic footage.",
          "Don't create content designed to deceive people about elections, voting, public health or emergencies, or fabricate events involving public figures.",
        ]}
      />
      <Clause
        title="3. Harmful and illegal content"
        bullets={[
          "Content that promotes, incites or glorifies violence, terrorism or violent extremism.",
          "Content that harasses, bullies, threatens or attacks people based on protected characteristics such as race, ethnicity, religion, disability, gender, sexual orientation or nationality.",
          "Content that encourages self-harm, suicide or eating disorders.",
          "Content that facilitates illegal activity, including weapons, drugs, fraud and scams.",
          "Graphic sexual content, or gratuitously gory or shocking content.",
          "Anything else that is illegal where you live or where the content is published.",
        ]}
      />
      <Clause
        title="4. Other people's rights"
        bullets={[
          "Don't upload material you don't have the rights to use.",
          "Don't create content that infringes copyrights, trademarks or other intellectual property, for example by recreating copyrighted characters or scenes for commercial use, or putting brand logos on content in a misleading way.",
          "Don't share anyone's private information without their permission.",
        ]}
      />
      <Clause
        title="5. Using the platform fairly"
        bullets={[
          "Don't try to bypass safety filters, content checks or usage limits, including through prompt tricks.",
          "Don't access the Service through bots, scrapers or unofficial APIs, or resell access without our written permission.",
          "Don't interfere with, overload or probe the security of the Service or the model providers behind it.",
          "Don't use the Service to create spam, malware or deceptive advertising.",
        ]}
      />
      <Clause
        title="6. Being honest about AI content"
        paragraphs={[
          "When the law or a platform's rules require it, and whenever viewers could reasonably mistake AI video for real footage, label your videos as AI-generated. Don't remove or hide any watermarks or provenance information a model adds.",
        ]}
      />
      <Clause
        title="7. Model provider policies"
        paragraphs={[
          "Each AI model is provided by a third party with its own usage policy, and those policies apply too. Providers may block prompts or outputs automatically. If a generation is refused for safety reasons, don't try to get around the refusal.",
        ]}
      />
      <Clause
        title="8. Enforcement"
        paragraphs={[
          "We may review content that is reported to us or flagged by automated systems. If you break this policy, we may remove content, block generations, suspend or close your account without refund, and report illegal activity to the authorities. The more serious the violation, the stronger our response.",
        ]}
      />
      <Clause
        title="9. Reporting"
        paragraphs={[
          `If you see content made with ${SITE_NAME} that breaks this policy, including a deepfake of you, email ${mail(COMPANY.supportEmail)} with a link to or description of the content. We treat reports involving minors, non-consensual content and impersonation as urgent.`,
        ]}
      />
    </CompanyPage>
  );
}
