import { Article, articleMetadata } from "@/app/_seo/article";
import { bestFreeGenerators } from "@/app/_seo/articles";
import type { Faq } from "@/app/_seo/json-ld";
import { RichText } from "@/app/_seo/rich-text";
import { Bullets, Paragraphs, Section } from "@/app/_seo/sections";

export const metadata = articleMetadata(bestFreeGenerators);

/*
 * Free plans change often. Before publishing (and at every update), check each
 * tool's pricing page and adjust the "Free option" lines; bump `updated` in
 * app/_seo/articles.ts when you do.
 */
const tools: {
  name: string;
  bestFor: string;
  free: string;
  about: string[];
  watchOut: string;
}[] = [
  {
    name: "VideoGenEditor (our tool)",
    bestFor: "Comparing many top models in one place",
    free: "Free sign-up; each clip's cost is shown before you generate",
    about: [
      "Full disclosure: this is our product. Instead of one model, [VideoGenEditor](/) gives you Seedance 2.5, Wan 3.0, LTX-2.5, MiniMax H3, Gemini Omni Flash, FLUX 3 Video and more behind one prompt box, so you can run the same idea through several models and keep the best result.",
      "It covers [text to video](/text-to-video), [image to video](/image-to-video), audio-driven [music videos](/ai-music-video-generator), plus an [AI video editor](/ai-video-editor) and [video extender](/ai-video-extender).",
    ],
    watchOut:
      "It isn't a “free forever” generator. Signing up and exploring is free, but generations are paid per clip, and the estimated cost is shown upfront.",
  },
  {
    name: "Google Veo (in Gemini and Flow)",
    bestFor: "Realistic footage with native sound",
    free: "Limited access on some free Google accounts; more with a Google AI plan",
    about: [
      "Google's Veo models are among the most realistic video generators available, with synchronized dialogue, sound effects and music generated alongside the picture. You reach them through the Gemini app and Google's Flow filmmaking tool.",
    ],
    watchOut: "Free access, where offered, is tightly limited, and the best models and higher quotas sit behind paid Google AI plans.",
  },
  {
    name: "OpenAI Sora",
    bestFor: "Creative, social-style clips with sound",
    free: "Free usage with limits in supported regions",
    about: [
      "Sora generates short videos with audio from text or images and is built around a social app for remixing and sharing. It's strong at physics, playful ideas and cameo-style content.",
    ],
    watchOut: "Availability varies by country, free usage is capped, and downloads carry a visible watermark.",
  },
  {
    name: "Kling AI",
    bestFor: "Smooth, cinematic motion and people",
    free: "Free credits that refresh regularly",
    about: [
      "Kuaishou's Kling is a favourite for human motion, dance and cinematic camera moves, with text-to-video, image-to-video, lip sync and effects in one web app.",
    ],
    watchOut: "Free generations can queue for a long time at busy hours, and free outputs are watermarked.",
  },
  {
    name: "Hailuo AI (MiniMax)",
    bestFor: "Expressive, dramatic shots from one image",
    free: "Free credits for new and returning users",
    about: [
      "Hailuo is MiniMax's consumer app for its video models, known for expressive faces, dynamic action and a strong image-to-video mode. (MiniMax H3 models are also available [on VideoGenEditor](/image-to-video).)",
    ],
    watchOut: "Free-tier resolution and length are limited, and watermark removal needs a paid plan.",
  },
  {
    name: "Runway",
    bestFor: "Professional control and editing tools",
    free: "A small one-time credit allowance",
    about: [
      "Runway pairs its Gen and Aleph models with a full creative suite: video-to-video, camera controls, references and editing tools used by professional studios.",
    ],
    watchOut: "The free allowance runs out quickly and doesn't refresh; serious use needs a subscription.",
  },
  {
    name: "Luma Dream Machine",
    bestFor: "Fast ideation and polished camera moves",
    free: "Limited free generations",
    about: [
      "Luma's Ray models produce smooth, cinematic clips with good camera control and keyframes, in a clean board-style interface that suits brainstorming.",
    ],
    watchOut: "Free-plan clips are typically watermarked and not licensed for commercial use.",
  },
  {
    name: "Pika",
    bestFor: "Fun effects and social content",
    free: "Monthly free credits",
    about: [
      "Pika focuses on playful, social-first features: effects that squish, inflate or transform objects, scene ingredients, and quick edits to existing clips.",
    ],
    watchOut: "The newest models and higher resolutions are usually reserved for paid plans.",
  },
  {
    name: "PixVerse",
    bestFor: "Templates and trending effects",
    free: "Daily free credits",
    about: [
      "PixVerse offers fast generation with a large library of viral templates and effects, alongside standard text- and image-to-video, on web and mobile.",
    ],
    watchOut: "Template-driven results can look similar to everyone else's, and free outputs carry a watermark.",
  },
  {
    name: "Open-source models (Wan and LTX-Video)",
    bestFor: "Truly free, unlimited use on your own GPU",
    free: "Free to download and run locally",
    about: [
      "Alibaba's Wan and Lightricks' LTX-Video release open model weights you can run at home with tools like ComfyUI, with no credits, no watermark and full control.",
    ],
    watchOut:
      "You need a powerful graphics card and some setup time. If you don't have one, the hosted versions (Wan 3.0 and LTX-2.5) run [in your browser here](/text-to-video).",
  },
];

const faqs: Faq[] = [
  {
    q: "What is the best free AI video generator?",
    a: "For truly free, unlimited use, open-source models like Wan and LTX-Video are the best option if you have a strong GPU. Among hosted tools, Kling, Hailuo and PixVerse have the most generous refreshing free credits, while Google Veo and Sora lead on realism with tighter limits.",
  },
  {
    q: "Is there a free AI video generator without a watermark?",
    a: "Most hosted free plans add a watermark. Running open-source models (Wan, LTX-Video) on your own computer gives you watermark-free videos at no cost. Paid plans on most platforms also remove it.",
  },
  {
    q: "How do I generate video with AI for free?",
    a: "Sign up for a tool with a free tier, write a prompt describing one scene, and generate. Our step-by-step guide on [how to make an AI video](/blog/how-to-make-ai-video) walks through it, including free options.",
  },
  {
    q: "What is the best AI video tool overall?",
    a: "There's no single winner: models trade places every few months and each has strengths. That's why using several models side by side, as [VideoGenEditor](/) lets you do, often beats committing to one.",
  },
  {
    q: "Can I use free AI videos commercially?",
    a: "It depends on the tool and plan. Some free plans are for personal use only. Always read the terms before using a clip in an ad or client project.",
  },
];

export default function BestFreeAiVideoGenerators() {
  return (
    <Article article={bestFreeGenerators} faqs={faqs}>
      <Section title="The short answer">
        <Paragraphs
          items={[
            "The best free AI video generator depends on what “free” means to you. If you want unlimited videos at no cost, run an open-source model like Wan or LTX-Video on your own GPU. If you want the most realistic results with no setup, Google Veo and OpenAI Sora lead, but their free use is limited. For generous everyday credits, Kling, Hailuo and PixVerse are hard to beat. And if you want to compare many models at once, try [our AI video generator](/).",
            "Free plans change often, so check each tool's pricing page for current limits before you commit.",
          ]}
        />
      </Section>

      <Section title="Quick comparison">
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-black/[0.03] dark:bg-white/[0.05]">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Tool</th>
                <th scope="col" className="px-4 py-3 font-semibold">Best for</th>
                <th scope="col" className="px-4 py-3 font-semibold">Free option</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/15">
              {tools.map((t) => (
                <tr key={t.name}>
                  <th scope="row" className="px-4 py-3 font-medium">{t.name}</th>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{t.bestFor}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{t.free}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="What we looked at">
        <Bullets
          items={[
            "Free access: is there a free tier, how much does it allow, and does it refresh?",
            "Output quality: realism, motion, and how well the model follows a prompt.",
            "Control: image-to-video, reference images, camera control, editing and extending.",
            "Catches: watermarks, resolution caps, queues and commercial-use limits.",
          ]}
        />
      </Section>

      <Section title="The 10 best free AI video generators">
        <ol className="flex flex-col gap-10">
          {tools.map((t, i) => (
            <li key={t.name} className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">
                {i + 1}. {t.name}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-foreground">Best for:</span> {t.bestFor} ·{" "}
                <span className="font-medium text-foreground">Free option:</span> {t.free}
              </p>
              <Paragraphs items={t.about} />
              <p className="rounded-lg bg-amber-500/10 px-4 py-3 leading-7 text-zinc-800 dark:text-zinc-200">
                <span className="font-medium">Watch out: </span>
                <RichText text={t.watchOut} />
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Honourable mentions: AI video makers for editing">
        <Paragraphs
          items={[
            "CapCut and Canva aren't video generators in the same sense, but both add AI features (captions, background removal, text-to-video templates) to easy editors with free plans. They're a good place to assemble AI-generated clips into a finished video with music and subtitles.",
          ]}
        />
      </Section>

      <Section title="How to choose">
        <Bullets
          items={[
            "Just experimenting? Start with a tool that has refreshing daily credits.",
            "Need realism and sound? Try Veo or Sora, or Seedance 2.5 and Wan 3.0 with native audio [on VideoGenEditor](/text-to-video).",
            "Animating photos? Pick a strong [image to video](/image-to-video) model.",
            "Making ads? Look for reference-image support to keep products accurate; see our [AI UGC video generator](/ai-ugc-video-generator).",
            "Want no limits at all? Run open-source models locally.",
          ]}
        />
      </Section>
    </Article>
  );
}
