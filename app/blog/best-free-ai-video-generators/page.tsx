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
      "Full disclosure: this one is ours, so weigh our opinion accordingly. Instead of one model, [VideoGenEditor](/) puts Seedance 2.5, Wan 3.0, LTX-2.5, MiniMax H3, Gemini Omni Flash, FLUX 3 Video and more behind one prompt box. You can run the same idea through several of them and keep whichever result you like best.",
      "It handles [text to video](/text-to-video), [image to video](/image-to-video) and audio-driven [music videos](/ai-music-video-generator), and has an [AI video editor](/ai-video-editor) and a [video extender](/ai-video-extender) for footage you already have.",
    ],
    watchOut:
      "It isn't a free-forever generator. Signing up and looking around costs nothing, but every clip is paid for. The upside is that you see the price before you generate, and a short 360p test costs a few cents.",
  },
  {
    name: "Google Veo (in Gemini and Flow)",
    bestFor: "Realistic footage with native sound",
    free: "Limited access on some free Google accounts; more with a Google AI plan",
    about: [
      "Veo is about as realistic as AI video gets right now. It generates dialogue, sound effects and music along with the picture. You use it through the Gemini app or Flow, Google's filmmaking tool.",
    ],
    watchOut: "Where there's free access at all, it's tightly limited. The best models and bigger quotas are kept for paid Google AI plans.",
  },
  {
    name: "OpenAI Sora",
    bestFor: "Creative, social-style clips with sound",
    free: "Free usage with limits in supported regions",
    about: [
      "Sora makes short videos with sound from text or images, and it's built around a social app where people remix each other's clips. It handles physics well and shines with playful ideas and cameo-style videos.",
    ],
    watchOut: "It isn't available everywhere, free use is capped, and downloads come with a visible watermark.",
  },
  {
    name: "Kling AI",
    bestFor: "Smooth, cinematic motion and people",
    free: "Free credits that refresh regularly",
    about: [
      "Kling, from Kuaishou, is a favourite for people in motion: dancing, walking, turning to camera. It also does cinematic camera moves well, and the web app bundles text-to-video, image-to-video, lip sync and effects.",
    ],
    watchOut: "At busy times, free generations can sit in a queue for a long while, and free videos are watermarked.",
  },
  {
    name: "Hailuo AI (MiniMax)",
    bestFor: "Expressive, dramatic shots from one image",
    free: "Free credits for new and returning users",
    about: [
      "Hailuo is the consumer app for MiniMax's video models. It's known for expressive faces, energetic action and a strong image-to-video mode. (You can also use MiniMax H3 models [on VideoGenEditor](/image-to-video).)",
    ],
    watchOut: "The free tier limits resolution and length, and you need a paid plan to lose the watermark.",
  },
  {
    name: "Runway",
    bestFor: "Professional control and editing tools",
    free: "A small one-time credit allowance",
    about: [
      "Runway pairs its Gen and Aleph models with a full creative toolkit: video-to-video, camera controls, references and the kind of editing tools professional studios rely on.",
    ],
    watchOut: "The free credits go fast and don't come back. For regular use you'll need a subscription.",
  },
  {
    name: "Luma Dream Machine",
    bestFor: "Fast ideation and polished camera moves",
    free: "Limited free generations",
    about: [
      "Luma's Ray models make smooth, cinematic clips with good camera control and keyframes. The board-style interface is pleasant to brainstorm in.",
    ],
    watchOut: "Free-plan clips are usually watermarked, and you can't use them commercially.",
  },
  {
    name: "Pika",
    bestFor: "Fun effects and social content",
    free: "Monthly free credits",
    about: [
      "Pika leans into fun, social-first features: effects that squish, inflate or transform things, scene ingredients, and quick edits to clips you already have.",
    ],
    watchOut: "The newest models and higher resolutions are usually kept for paid plans.",
  },
  {
    name: "PixVerse",
    bestFor: "Templates and trending effects",
    free: "Daily free credits",
    about: [
      "PixVerse is quick, and it has a big library of viral templates and effects on top of regular text- and image-to-video, on the web and on mobile.",
    ],
    watchOut: "Template videos can end up looking like everyone else's, and free downloads are watermarked.",
  },
  {
    name: "Open-source models (Wan and LTX-Video)",
    bestFor: "Truly free, unlimited use on your own GPU",
    free: "Free to download and run locally",
    about: [
      "Alibaba (Wan) and Lightricks (LTX-Video) publish open model weights you can run at home with tools like ComfyUI. There are no credits and no watermark, and you control everything.",
    ],
    watchOut:
      "You'll need a powerful graphics card and an afternoon for setup. If you don't have the hardware, the hosted versions (Wan 3.0 and LTX-2.5) run [in your browser here](/text-to-video).",
  },
];

const faqs: Faq[] = [
  {
    q: "What is the best free AI video generator?",
    a: "If you have a strong GPU, open-source models like Wan and LTX-Video are the only truly free, unlimited option. Among hosted tools, Kling, Hailuo and PixVerse have the most generous free credits that refresh. Google Veo and Sora look the most realistic, but their free limits are tighter.",
  },
  {
    q: "Is there a free AI video generator without a watermark?",
    a: "Not many. Most hosted free plans add a watermark. Running an open-source model (Wan or LTX-Video) on your own computer gets you watermark-free video at no cost, and most platforms drop the watermark on paid plans.",
  },
  {
    q: "How do I generate video with AI for free?",
    a: "Sign up for a tool with a free tier, describe one scene in your prompt, and generate. Our step-by-step guide on [how to make an AI video](/blog/how-to-make-ai-video) walks through the whole thing, free options included.",
  },
  {
    q: "What is the best AI video tool overall?",
    a: "There isn't one. The top spot changes hands every few months, and each model is good at different things. That's why trying several side by side, which is what [VideoGenEditor](/) is built for, usually beats committing to one.",
  },
  {
    q: "Can I use free AI videos commercially?",
    a: "It depends on the tool and the plan. Some free plans are for personal use only, so read the terms before you put a clip in an ad or a client project.",
  },
];

export default function BestFreeAiVideoGenerators() {
  return (
    <Article article={bestFreeGenerators} faqs={faqs}>
      <Section title="The short answer">
        <Paragraphs
          items={[
            "The best free AI video generator depends on what “free” means to you. Want unlimited videos and don't mind some setup? Run an open-source model like Wan or LTX-Video on your own GPU. Want the most realistic results with no setup? Google Veo and OpenAI Sora lead, but you won't get much free use. Want generous everyday credits? Kling, Hailuo and PixVerse are hard to beat. And if you'd like to compare lots of models at once, try [our AI video generator](/).",
            "Free plans change all the time, so check each tool's pricing page for the current limits before you commit.",
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
            "Free access: is there a free tier, how far does it go, and does it refresh?",
            "Quality: how real it looks, how it moves, and how closely it follows the prompt.",
            "Control: image-to-video, reference images, camera moves, editing and extending.",
            "The catches: watermarks, resolution caps, queues and limits on commercial use.",
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
            "CapCut and Canva aren't really video generators, but both add AI features (captions, background removal, text-to-video templates) to easy editors with free plans. They're a handy place to stitch your AI clips into a finished video with music and subtitles.",
          ]}
        />
      </Section>

      <Section title="How to choose">
        <Bullets
          items={[
            "Just playing around? Start with a tool whose free credits refresh daily.",
            "Need realism and sound? Try Veo or Sora, or Seedance 2.5 and Wan 3.0 with native audio [on VideoGenEditor](/text-to-video).",
            "Animating photos? Pick a strong [image to video](/image-to-video) model.",
            "Making ads? Look for reference images, which keep your product accurate. Our [AI UGC video generator](/ai-ugc-video-generator) is set up for this.",
            "Want no limits at all? Run an open-source model on your own machine.",
          ]}
        />
      </Section>
    </Article>
  );
}
