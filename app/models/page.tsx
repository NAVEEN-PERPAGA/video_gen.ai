import type { Metadata } from "next";
import Link from "next/link";
import { PlainHeader } from "@/app/_seo/article";
import { type Faq, faqPageLd, JsonLd } from "@/app/_seo/json-ld";
import { modelPageHref, modelPages } from "@/app/_seo/model-pages";
import { ModelTable } from "@/app/_seo/model-table";
import { cheapestPerSecond, modelSpecs, perSecond, usd } from "@/app/_seo/models";
import { Bullets, FaqList, Paragraphs, Section } from "@/app/_seo/sections";
import { PromptBox } from "@/app/_seo/tool-page";
import { SiteFooter } from "@/app/site-footer";
import { absoluteUrl, OG_IMAGE } from "@/lib/site";

const TITLE = "AI Video Models Compared – Seedance, Wan, Gemini & More";
const DESCRIPTION =
  "Every AI video model in one place, compared: clip length, resolution, sound, inputs and price per second. Pick the right model for each shot.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/models" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/models", type: "website", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const longest = [...modelSpecs].sort((a, b) => (b.maxSeconds ?? 0) - (a.maxSeconds ?? 0))[0];
const cheapest = modelSpecs.find((s) => s.fromPerSecond === cheapestPerSecond)!;

/** Makers in the order they first appear in the page list, each with its models. */
const byMaker = [...new Set(modelPages.map((m) => m.maker))].map((maker) => ({
  maker,
  models: modelPages.filter((m) => m.maker === maker),
}));

const FAQS: Faq[] = [
  {
    q: "Which AI video model is best?",
    a: "There isn't one winner. [Seedance 2.5](/models/seedance-2-5) is the pick for long, consistent scenes, [Gemini Omni Flash 1.1](/models/gemini-omni-flash-1-1) for cheap tests and 4K finals, [MiniMax H3](/models/minimax-h3) for cinematic character work and [LTX-2.3 Fast](/models/ltx-2-3-fast) for audio-driven video. The practical answer is to run your prompt on two or three and keep the best take.",
  },
  {
    q: "Which AI video model is cheapest?",
    a: `${cheapest.name} starts at ${usd(cheapestPerSecond)} a second at its lowest resolution. For HD, [LTX-2.3 Fast](/models/ltx-2-3-fast) and [Grok Imagine Video 1.5 Lite](/models/grok-imagine-video-1-5-lite) both cost ${usd(perSecond("lightricks:ltx@2.3-fast", "720p"))} a second at 720p. The composer shows each clip's price before you generate.`,
  },
  {
    q: "Which AI video model makes the longest clips?",
    a: `${longest.name}, at up to ${longest.maxSeconds} seconds in a single generation. Any clip can be made longer with the [AI video extender](/ai-video-extender).`,
  },
  {
    q: "Can I switch models without starting over?",
    a: "Yes. In the studio your prompt and attachments carry over when you change models, so comparing two models takes one click.",
  },
];

export default function ModelsIndex() {
  return (
    <>
      <PlainHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "AI video models",
          itemListElement: modelPages.map((m, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: m.name,
            url: absoluteUrl(`/models/${m.slug}`),
          })),
        }}
      />
      <JsonLd data={faqPageLd(FAQS)} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-12 pb-20">
        <header className="flex max-w-3xl flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">AI Video Models, Compared</h1>
          <p className="text-lg leading-8 text-zinc-700 dark:text-zinc-300">
            Every AI video model in the studio, side by side. Each one is good at something different: some hold a scene
            together for 30 seconds, some render in 4K, some build a video around your song. Compare them here, open a
            model for its full specs, prices and prompt tips, or just try the same prompt on a few.
          </p>
        </header>

        <div className="max-w-3xl">
          <PromptBox />
        </div>

        <article className="mt-6 flex flex-col gap-14">
          <Section id="compare" title="Every model at a glance">
            <Paragraphs
              items={[
                "The longest clip each model makes in one generation, its top resolution, its lowest price per second, whether it generates sound, and what you can start from. Higher resolutions cost more; each model's page lists every tier.",
              ]}
            />
            <ModelTable />
          </Section>

          {byMaker.map(({ maker, models }) => (
            <Section key={maker} title={`${maker} video models`}>
              <ul className="grid gap-4 sm:grid-cols-2">
                {models.map((m) => {
                  const spec = modelSpecs.find((s) => s.id === m.id);
                  return (
                    <li key={m.slug}>
                      <Link
                        href={modelPageHref(m.id)!}
                        className="flex h-full flex-col gap-1.5 rounded-xl border border-black/10 p-5 transition hover:border-indigo-400 dark:border-white/15"
                      >
                        <span className="font-semibold">{m.name}</span>
                        <span className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{m.summary}</span>
                        {spec?.fromPerSecond && (
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            From {usd(spec.fromPerSecond)}/s · up to {spec.maxResolution}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ))}

          <Section id="choose" title="How to choose an AI video model">
            <Bullets
              items={[
                "Testing an idea? Start cheap: a 360p run on [Gemini Omni Flash 1.1](/models/gemini-omni-flash-1-1), or [LTX-2.5 Fast](/models/ltx-2-5-fast).",
                "Need a long, consistent scene or an ad? [Seedance 2.5](/models/seedance-2-5) or [Wan 3.0](/models/wan-3-0).",
                "Animating a photo? [MiniMax H3 Max](/models/minimax-h3-max) or [Grok Imagine Video 1.5](/models/grok-imagine-video-1-5). See [AI image to video](/image-to-video).",
                "Making a music video? [LTX-2.3 Fast](/models/ltx-2-3-fast) builds the video around your track.",
                "Need 4K? [Gemini Omni Flash 1.1](/models/gemini-omni-flash-1-1) or [LTX-2.5 Fast](/models/ltx-2-5-fast).",
                "Need text on screen? [FLUX 3 Video](/models/flux-3-video) renders titles cleanly.",
              ]}
            />
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>
        </article>
      </main>
      <SiteFooter className="pb-12" />
    </>
  );
}
