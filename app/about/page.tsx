import { Clause, CompanyPage, companyMetadata } from "@/app/_seo/company-page";
import { JsonLd } from "@/app/_seo/json-ld";
import { absoluteUrl, COMPANY, SITE_NAME } from "@/lib/site";

export const metadata = companyMetadata(
  "/about",
  "About Us",
  `${SITE_NAME} puts the world's leading AI video models in one place, with honest, upfront pricing for every clip.`,
);

export default function AboutPage() {
  return (
    <CompanyPage
      title={`About ${SITE_NAME}`}
      intro={`${SITE_NAME} is an AI video studio in your browser. We bring the leading video generation models together behind one simple prompt box, so anyone can turn an idea, a photo or a song into video, and pick the right model for every shot.`}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_NAME,
          url: absoluteUrl("/"),
          email: COMPANY.supportEmail,
        }}
      />
      <Clause
        title="Why we built it"
        paragraphs={[
          "AI video is moving fast. A new model leads every few months, and each one is good at something different: one holds a character steady across a long scene, another nails camera motion, another renders in 4K. Most tools lock you into a single model and a monthly subscription. We think creators should be able to use the best model for each shot, and pay only for what they make.",
        ]}
      />
      <Clause
        title="What we offer"
        bullets={[
          "Many leading models in one place: Seedance, Wan, LTX, MiniMax, Gemini Omni Flash, FLUX and more.",
          "Every way to start: [text to video](/text-to-video), [image to video](/image-to-video), audio-driven [music videos](/ai-music-video-generator), plus an [AI video editor](/ai-video-editor) and [extender](/ai-video-extender).",
          "Upfront pricing: the estimated cost of every clip is shown before you generate it.",
          "Workspaces, so teams and clients can keep projects organised and shared.",
        ]}
      />
      <Clause
        title="What we believe"
        bullets={[
          "Be transparent. You should know what a video costs and which model made it.",
          "Stay model-neutral. We add new models as they're released and let the results speak.",
          "Create responsibly. AI video is powerful, so we don't allow deceptive deepfakes, non-consensual content or impersonation. Read our [Acceptable Use Policy](/acceptable-use).",
          "Respect your work. Your prompts and videos belong to you, and we don't use them to train AI models. See our [Privacy Policy](/privacy).",
        ]}
      />
      <Clause
        title="Get in touch"
        paragraphs={[
          `Questions, feedback or partnership ideas? Email [${COMPANY.supportEmail}](mailto:${COMPANY.supportEmail}) or visit our [contact page](/contact).`,
        ]}
      />
    </CompanyPage>
  );
}
