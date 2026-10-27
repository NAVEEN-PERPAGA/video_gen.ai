import Image from "next/image";
import Link from "next/link";
import { PlainHeader } from "@/app/_seo/article";
import { JsonLd } from "@/app/_seo/json-ld";
import { modelPageBySlug } from "@/app/_seo/model-pages";
import { usd } from "@/app/_seo/models";
import { ModelTable } from "@/app/_seo/model-table";
import { RichText } from "@/app/_seo/rich-text";
import { Bullets, Cards, FaqList, Paragraphs, Section, Steps } from "@/app/_seo/sections";
import { type ShowcaseClip, SHOWCASE } from "@/app/_seo/showcase";
import { PromptBox, RelatedTools, ToolJsonLd } from "@/app/_seo/tool-page";
import { home } from "@/app/_seo/tools";
import { SiteFooter } from "@/app/site-footer";
import imageToVideoArt from "@/assets/images/image-to-video-2-3.png";
import videoToVideoArt from "@/assets/images/video-to-video-2-3.png";
import { LIMITS } from "@/lib/editor/timeline";
import { formatUsd, TIERS } from "@/lib/plans";
import { imageModels, organisationLogos, videoModels } from "@/lib/runware/models";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

const LOWEST_PLAN = Math.min(...TIERS.map((t) => t.price.month));

/** Starter prompts under the box; each opens the studio on a model that suits it. */
const EXAMPLES: { label: string; prompt: string; model?: string; mode?: "image" }[] = [
  {
    label: "Rainy street at dusk",
    prompt: "A cyclist rides through a puddle on a wet city street at dusk, low tracking shot, neon reflections",
    model: "seedance-2-5",
  },
  {
    label: "Morning coffee",
    prompt: "A slow dolly-in on a ceramic mug on a sunlit kitchen table, steam rising, shallow depth of field, warm morning light",
    model: "ltx-2-5-fast",
  },
  {
    label: "Café conversation",
    prompt: "Two friends laugh at a café table and clink their cups, handheld close-up, natural window light",
    model: "kling-video-4-0",
  },
  {
    label: "Product photo",
    prompt: "A glass perfume bottle on wet black stone, soft rim light, studio product photography",
    mode: "image",
  },
];

const PROMISES = [
  { title: "See the price first", body: "An estimate for your exact settings sits next to the button." },
  { title: "Failed clips are free", body: "If a generation fails, you aren't charged for it." },
  { title: "Credits never expire", body: "Pay per clip, not per seat. Unused credits roll over." },
  { title: `Plans from $${LOWEST_PLAN}`, body: "Monthly, or a one-time top-up when you need it." },
];

/** Every organisation with a model in the studio and a logo to show, video makers first. */
const MAKERS = [...new Set([...videoModels, ...imageModels].map((m) => m.organisation))].filter(
  (org) => organisationLogos[org],
);

const WORKFLOW = [
  {
    title: "Generate",
    body: `${videoModels.length} video models and ${imageModels.length} image models behind one prompt box. Start from text, a photo, a clip or a song, and try the same prompt on another model in a click.`,
    href: "/generate",
    cta: "Open the studio",
  },
  {
    title: "Edit on a timeline",
    body: `Cut your clips together in the [timeline editor](/edit): trim, reorder, add captions and music, in 16:9, 9:16 or 1:1, up to ${LIMITS.durationSeconds / 60} minutes long.`,
    href: "/edit",
    cta: "Open the editor",
  },
  {
    title: "Export and post",
    body: "Render the finished cut to MP4 and download it, sized for YouTube, TikTok, Reels or Shorts.",
    href: "/ai-video-editor",
    cta: "More on editing",
  },
];

/**
 * The home page: the AI video generator landing page (the studio itself is at
 * /generate). It uses the `home` copy from tools.ts like a tool page, but adds a
 * product hero, model makers, gallery, workflow and pricing around the article.
 * Static, with no auth or data fetching, like every landing page.
 */
export function HomePage() {
  return (
    <>
      <PlainHeader />
      <main className="flex w-full flex-1 flex-col pb-16">
        <Hero />
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-4">
          <Makers />
          {SHOWCASE.length > 0 && <Showcase clips={SHOWCASE} />}
          <Workflow />
          <Illustrations />

          <article className="flex max-w-3xl flex-col gap-14">
            <Section id="how-to" title={home.howTo.title}>
              <Steps steps={home.howTo.steps} />
            </Section>
            {home.sections.map((s) => (
              <Section key={s.title} title={s.title}>
                {s.paragraphs && <Paragraphs items={s.paragraphs} />}
                {s.bullets && <Bullets items={s.bullets} />}
              </Section>
            ))}
          </article>

          {home.models && (
            <Section id="models" title={home.models.title}>
              <div className="max-w-3xl">
                <Paragraphs items={[home.models.intro]} />
              </div>
              <ModelTable />
            </Section>
          )}

          <Pricing />

          <article className="flex max-w-3xl flex-col gap-14">
            <Section id="use-cases" title={home.useCases.title}>
              <Cards items={home.useCases.items} />
            </Section>
            <Section id="faq" title="Frequently asked questions">
              <FaqList faqs={home.faqs} />
            </Section>
          </article>

          <ClosingCta />
          <div className="max-w-3xl">
            <RelatedTools paths={home.related} />
          </div>
        </div>
      </main>
      <SiteFooter className="pb-12" />

      <ToolJsonLd tool={home} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": absoluteUrl("/#organization"),
              name: SITE_NAME,
              url: absoluteUrl("/"),
              logo: absoluteUrl("/logo.png"),
            },
            {
              "@type": "WebSite",
              "@id": absoluteUrl("/#website"),
              name: SITE_NAME,
              url: absoluteUrl("/"),
              publisher: { "@id": absoluteUrl("/#organization") },
            },
          ],
        }}
      />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-black/5 dark:border-white/10">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgb(99_102_241/0.18),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgb(99_102_241/0.25),transparent_60%)]"
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 pt-14 pb-12 text-center sm:pt-20">
        <p className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
          {videoModels.length} video models · {imageModels.length} image models · one prompt box
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{home.h1}</h1>
        <p className="text-lg leading-8 text-pretty text-zinc-700 dark:text-zinc-300">
          <RichText text={home.intro} />
        </p>

        <div className="flex w-full flex-col items-center gap-3 text-left">
          <PromptBox modes placeholder={home.preset.placeholder} />
          <ul className="flex flex-wrap justify-center gap-2 text-sm" aria-label="Example prompts">
            {EXAMPLES.map((e) => {
              const page = e.model ? modelPageBySlug(e.model) : undefined;
              const query = { prompt: e.prompt, ...(page && { model: page.slug }), ...(e.mode && { mode: e.mode }) };
              return (
                <li key={e.label}>
                  <Link
                    href={{ pathname: "/generate", query }}
                    title={e.prompt}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-background px-3 py-1.5 text-zinc-700 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-white/15 dark:text-zinc-300 dark:hover:text-indigo-300"
                  >
                    {e.label}
                    <span className="text-zinc-500">· {page?.name ?? "Image"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <ul className="mt-4 grid w-full gap-3 text-left sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {PROMISES.map((p) => (
            <li key={p.title} className="rounded-xl border border-black/10 bg-background/70 p-4 dark:border-white/15">
              <p className="font-semibold">{p.title}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Makers() {
  return (
    <section aria-labelledby="makers" className="flex flex-col items-center gap-4 pt-10 text-center">
      <h2 id="makers" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Models from the labs leading AI video and images
      </h2>
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
        {MAKERS.map((org) => {
          const logo = organisationLogos[org];
          const tile = logo.tile === "dark" ? "bg-zinc-900 ring-white/10" : "bg-white ring-black/10";
          return (
            <li key={org} className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <span className={`flex size-7 items-center justify-center rounded-md p-1 ring-1 ${tile}`}>
                <Image src={logo.src} alt="" className={`size-full object-contain ${logo.invert ? "invert" : ""}`} />
              </span>
              {org}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Showcase({ clips }: { clips: ShowcaseClip[] }) {
  return (
    <Section id="showcase" title="Made in the studio">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clips.map((c) => {
          const page = modelPageBySlug(c.model);
          return (
            <li key={c.video} className="flex flex-col overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
              <video
                src={c.video}
                poster={c.poster}
                controls
                muted
                loop
                playsInline
                preload="none"
                className={`w-full bg-black object-cover ${c.aspect === "9:16" ? "aspect-[9/16]" : c.aspect === "1:1" ? "aspect-square" : "aspect-video"}`}
              />
              <div className="flex flex-col gap-1.5 p-4 text-sm">
                <p className="font-medium">
                  {page ? (
                    <Link href={`/models/${page.slug}`} className="hover:underline">
                      {page.name}
                    </Link>
                  ) : (
                    c.model
                  )}
                  <span className="font-normal text-zinc-500">
                    {" "}
                    · {c.seconds}s · {c.resolution} · {usd(c.cost)}
                  </span>
                </p>
                <p className="line-clamp-3 leading-6 text-zinc-600 dark:text-zinc-400">{c.prompt}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function Workflow() {
  return (
    <Section id="workflow" title="From prompt to finished video, in one place">
      <ol className="grid gap-4 md:grid-cols-3">
        {WORKFLOW.map((w, i) => (
          <li key={w.title} className="flex flex-col gap-3 rounded-xl border border-black/10 p-5 dark:border-white/15">
            <span className="flex size-8 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              {i + 1}
            </span>
            <h3 className="text-lg font-semibold">{w.title}</h3>
            <p className="flex-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              <RichText text={w.body} />
            </p>
            <Link href={w.href} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              {w.cta} →
            </Link>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Illustrations() {
  const items = [
    {
      art: imageToVideoArt,
      alt: "A photo of a hiker at a mountain lake turned into a video of her raising her arms at sunset",
      title: "Bring a photo to life",
      body: "Upload a picture and say how it should move. The [image to video](/image-to-video) models keep it recognisably yours.",
    },
    {
      art: videoToVideoArt,
      alt: "A skateboarding clip restyled from a plain sky to a sunset skatepark with palm trees",
      title: "Give a clip a new look",
      body: "Change the setting, light or style of footage you already have with the [AI video editor](/ai-video-editor), or keep it going with the [video extender](/ai-video-extender).",
    },
  ];
  return (
    <section aria-label="Examples" className="grid gap-6 sm:grid-cols-2">
      {items.map((it) => (
        <figure key={it.title} className="flex flex-col overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
          <Image
            src={it.art}
            alt={it.alt}
            sizes="(min-width: 1024px) 480px, (min-width: 640px) 50vw, 100vw"
            className="aspect-[4/5] w-full object-cover object-top"
          />
          <figcaption className="flex flex-col gap-1 p-5">
            <span className="font-semibold">{it.title}</span>
            <span className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              <RichText text={it.body} />
            </span>
          </figcaption>
        </figure>
      ))}
    </section>
  );
}

function Pricing() {
  return (
    <Section id="pricing" title="Simple pricing, paid in credits">
      <p className="max-w-3xl leading-7 text-zinc-700 dark:text-zinc-300">
        Every plan adds its price in credits to your wallet each month, and one credit is one dollar of generation.
        Buy a one-time top-up instead if you&apos;d rather not subscribe. Credits never expire.
      </p>
      <ul className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((t) => (
          <li
            key={t.id}
            className={`flex flex-col gap-2 rounded-xl border p-5 ${t.highlight ? "border-indigo-400 ring-1 ring-indigo-400" : "border-black/10 dark:border-white/15"}`}
          >
            <p className="flex items-center justify-between font-semibold">
              {t.name}
              {t.highlight && (
                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  Popular
                </span>
              )}
            </p>
            <p>
              <span className="text-3xl font-semibold tracking-tight">{formatUsd(t.price.month)}</span>
              <span className="text-sm text-zinc-500"> / month</span>
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatUsd(t.monthlyCredits)} in credits each month</p>
            <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{t.tagline}</p>
          </li>
        ))}
      </ul>
      <Link href="/pricing" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        Compare plans →
      </Link>
    </Section>
  );
}

function ClosingCta() {
  return (
    <section
      aria-labelledby="start"
      className="flex flex-col items-center gap-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] px-4 py-10 text-center sm:px-10"
    >
      <h2 id="start" className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Make your first clip
      </h2>
      <p className="max-w-xl text-zinc-700 dark:text-zinc-300">
        Describe a shot, pick a model and see the price before you generate. Sign-up is free.
      </p>
      <div className="flex w-full justify-center text-left">
        <PromptBox id="prompt-end" modes placeholder={home.preset.placeholder} />
      </div>
    </section>
  );
}
