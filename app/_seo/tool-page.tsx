import type { Metadata } from "next";
import Link from "next/link";
import type { ComposerPreset } from "@/app/generate/video-composer";
import { PlainHeader } from "@/app/_seo/article";
import { type Faq, faqPageLd, JsonLd } from "@/app/_seo/json-ld";
import { plainText, RichText } from "@/app/_seo/rich-text";
import { ModelTable } from "@/app/_seo/model-table";
import { Bullets, Cards, FaqList, Paragraphs, Section, Steps } from "@/app/_seo/sections";
import { SiteFooter } from "@/app/site-footer";
import { TIERS } from "@/lib/plans";
import { absoluteUrl, OG_IMAGE, SITE_NAME, toolLinks } from "@/lib/site";

/** The copy of one tool landing page; see app/_seo/tools.ts. */
export interface ToolContent {
  path: string;
  /** <title>, 60 characters or fewer. */
  title: string;
  /** Meta description, about 150 characters. */
  description: string;
  h1: string;
  /** First paragraph; carries the primary keyword in its first 100 words. */
  intro: string;
  preset: ComposerPreset;
  howTo: { title: string; steps: { title: string; body: string }[] };
  sections: { title: string; paragraphs?: string[]; bullets?: string[] }[];
  /** A comparison table of every video model, built from the model files. */
  models?: { title: string; intro: string };
  useCases: { title: string; items: { title: string; body: string }[] };
  faqs: Faq[];
  /** Other tool pages to point to, by path. */
  related: string[];
}

export function toolMetadata(tool: ToolContent): Metadata {
  return {
    title: { absolute: tool.title },
    description: tool.description,
    alternates: { canonical: tool.path },
    openGraph: { title: tool.title, description: tool.description, url: tool.path, type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: tool.title, description: tool.description },
  };
}

/**
 * A tool landing page, prerendered with no auth or data fetching so it's
 * static and fast: keyword H1 and intro, a prompt box that opens the studio
 * (/generate) with this tool's preset, then a how-to, feature sections, use
 * cases, FAQ and related tools.
 */
export function ToolPage({ tool }: { tool: ToolContent }) {
  const related = tool.related
    .map((href) => toolLinks.find((l) => l.href === href))
    .filter((l) => l !== undefined);

  return (
    <>
      <PlainHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-12 pb-16">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{tool.h1}</h1>
          <p className="max-w-3xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">
            <RichText text={tool.intro} />
          </p>
        </div>

        <PromptBox
          hidden={tool.path === "/" ? {} : { tool: tool.path.slice(1) }}
          placeholder={tool.preset.placeholder}
        />
        {tool.path === "/ai-video-editor" && (
          <p className="-mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Want to cut clips together, add captions or music?{" "}
            <Link href="/edit" className="font-medium text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
              Open the timeline editor
            </Link>
            .
          </p>
        )}

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: `${SITE_NAME}: ${tool.h1}`,
            description: plainText(tool.description),
            url: absoluteUrl(tool.path),
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              lowPrice: Math.min(...TIERS.map((t) => t.price.month)),
              highPrice: Math.max(...TIERS.map((t) => t.price.month)),
              offerCount: TIERS.length,
              url: absoluteUrl("/pricing"),
            },
          }}
        />
        {tool.path === "/" && (
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
        )}
        <JsonLd data={faqPageLd(tool.faqs)} />

        <article className="mt-8 flex max-w-3xl flex-col gap-14">
          <Section id="how-to" title={tool.howTo.title}>
            <Steps steps={tool.howTo.steps} />
          </Section>

          {tool.sections.map((s) => (
            <Section key={s.title} title={s.title}>
              {s.paragraphs && <Paragraphs items={s.paragraphs} />}
              {s.bullets && <Bullets items={s.bullets} />}
            </Section>
          ))}

          {tool.models && (
            <Section id="models" title={tool.models.title}>
              <Paragraphs items={[tool.models.intro]} />
              <ModelTable />
            </Section>
          )}

          <Section id="use-cases" title={tool.useCases.title}>
            <Cards items={tool.useCases.items} />
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={tool.faqs} />
          </Section>

          {related.length > 0 && (
            <Section id="related" title="More AI video tools">
              <ul className="flex flex-wrap gap-2">
                {related.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-indigo-400 hover:text-indigo-700 dark:border-white/15 dark:hover:text-indigo-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </article>
      </main>
      <SiteFooter className="pb-12" />
    </>
  );
}

/**
 * A plain GET form (no client JavaScript): submitting opens the studio with
 * the typed prompt filled in. `hidden` picks the preset, e.g. { tool } or { model }.
 */
export function PromptBox({ hidden = {}, placeholder }: { hidden?: Record<string, string>; placeholder?: string }) {
  return (
    <form
      action="/generate"
      method="get"
      className="flex max-w-3xl flex-col gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-sm focus-within:border-indigo-400 dark:border-white/15 dark:bg-zinc-900"
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor="prompt" className="sr-only">
        Describe your video
      </label>
      <textarea
        id="prompt"
        name="prompt"
        rows={3}
        maxLength={2000}
        placeholder={placeholder ?? "Describe the video you want to make…"}
        className="w-full resize-none bg-transparent px-2 py-1 text-base outline-none placeholder:text-zinc-500"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="px-2 text-sm text-zinc-600 dark:text-zinc-400">Free sign-up · see the cost before you generate</p>
        <button
          type="submit"
          className="flex h-10 shrink-0 cursor-pointer items-center rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          Generate video
        </button>
      </div>
    </form>
  );
}
