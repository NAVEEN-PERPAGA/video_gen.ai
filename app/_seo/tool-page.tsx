import type { Metadata } from "next";
import Link from "next/link";
import type { ComposerPreset } from "@/app/generate/video-composer";
import { type Faq, faqPageLd, JsonLd } from "@/app/_seo/json-ld";
import { plainText, RichText } from "@/app/_seo/rich-text";
import { modelSpecs, usd } from "@/app/_seo/models";
import { Bullets, Cards, FaqList, Paragraphs, Section, Steps, Table } from "@/app/_seo/sections";
import { WorkspaceShell } from "@/app/workspace-shell";
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
 * A tool landing page: keyword H1 and intro, the working studio preset for
 * this tool, then a how-to, feature sections, use cases, FAQ and related tools.
 */
export function ToolPage({
  tool,
  searchParams,
}: {
  tool: ToolContent;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const related = tool.related
    .map((href) => toolLinks.find((l) => l.href === href))
    .filter((l) => l !== undefined);

  return (
    <WorkspaceShell
      path={tool.path}
      searchParams={searchParams}
      preset={tool.preset}
      hero={
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{tool.h1}</h1>
          <p className="max-w-3xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">
            <RichText text={tool.intro} />
          </p>
        </div>
      }
    >
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
            <Table
              caption="AI video models compared"
              head={["Model", "Made by", "Max length", "Max resolution", "Starts from", "Inputs"]}
              rows={modelSpecs.map((m) => [
                m.name,
                m.maker,
                m.maxSeconds ? `${m.maxSeconds}s` : "–",
                m.maxResolution ?? "–",
                m.fromPerSecond ? `${usd(m.fromPerSecond)}/s` : "–",
                m.inputs.join(", "),
              ])}
            />
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
    </WorkspaceShell>
  );
}
