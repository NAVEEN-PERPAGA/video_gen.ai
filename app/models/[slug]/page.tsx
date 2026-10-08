import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlainHeader } from "@/app/_seo/article";
import { type Faq, faqPageLd, JsonLd } from "@/app/_seo/json-ld";
import { type ModelPage, modelPageBySlug, modelPages } from "@/app/_seo/model-pages";
import { aspectRatios, modelSpecs, priceTiers, usd, videoModel } from "@/app/_seo/models";
import { RichText } from "@/app/_seo/rich-text";
import { Bullets, Cards, FaqList, Paragraphs, Section, Table } from "@/app/_seo/sections";
import { PromptBox } from "@/app/_seo/tool-page";
import { SiteFooter } from "@/app/site-footer";
import type { RunwareModel } from "@/lib/runware/models";
import { absoluteUrl, OG_IMAGE, toolLinks } from "@/lib/site";

// Only the models in app/_seo/model-pages.ts have pages; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return modelPages.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/models/[slug]">): Promise<Metadata> {
  const page = modelPageBySlug((await params).slug);
  if (!page) return {};
  const path = `/models/${page.slug}`;
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: path },
    openGraph: { title: page.title, description: page.description, url: path, type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

/** One video model: what it is, its specs and prices (from data/video/models), how to use it, and alternatives. */
export default async function ModelPageView({ params }: PageProps<"/models/[slug]">) {
  const page = modelPageBySlug((await params).slug);
  if (!page) notFound();
  const model = videoModel(page.id);
  const spec = modelSpecs.find((s) => s.id === page.id)!;
  const path = `/models/${page.slug}`;
  // The shortest clip quoted in prices: 5 seconds, or the model's minimum if longer.
  const short = Math.max(5, spec.minSeconds ?? 5);
  const faqs = [...page.faqs, ...(page.faqs.some((f) => /cost/i.test(f.q)) ? [] : [costFaq(page, model, short)])];
  const tools = page.tools.map((href) => toolLinks.find((l) => l.href === href)).filter((l) => l !== undefined);

  return (
    <>
      <PlainHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "AI video models", item: absoluteUrl("/models") },
            { "@type": "ListItem", position: 3, name: page.name, item: absoluteUrl(path) },
          ],
        }}
      />
      <JsonLd data={faqPageLd(faqs)} />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pt-10 pb-20">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/models" className="hover:underline">
            AI video models
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{page.maker}</span>
        </nav>

        <header className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{page.h1}</h1>
          <p className="text-lg leading-8 text-zinc-700 dark:text-zinc-300">
            <RichText text={page.intro} />
          </p>
        </header>

        <PromptBox hidden={{ model: page.slug }} placeholder={`Describe a shot to make with ${page.name}…`} />

        <article className="mt-6 flex flex-col gap-14">
          <Section id="specs" title={`${page.name} specs`}>
            <Specs page={page} model={model} spec={spec} />
          </Section>

          <Section id="pricing" title={`${page.name} pricing`}>
            <Pricing model={model} short={short} />
          </Section>

          <Section id="strengths" title="What it's good at">
            <Bullets items={page.strengths} />
          </Section>

          <Section id="best-for" title="Best for">
            <Cards items={page.bestFor} />
          </Section>

          <Section id="limits" title="Things to know">
            <Bullets items={page.limits} />
          </Section>

          <Section id="prompt" title={`A ${page.name} prompt to try`}>
            <blockquote className="rounded-xl border-l-4 border-indigo-500 bg-indigo-500/5 px-5 py-4 leading-7 text-zinc-800 dark:text-zinc-200">
              {page.prompt.text}
            </blockquote>
            <Paragraphs items={[page.prompt.note]} />
          </Section>

          <Section id="alternatives" title={`Alternatives to ${page.name}`}>
            <ul className="grid gap-4 sm:grid-cols-3">
              {page.alternatives.map((alt) => {
                const other = modelPageBySlug(alt.slug)!;
                return (
                  <li key={alt.slug}>
                    <Link
                      href={`/models/${other.slug}`}
                      className="flex h-full flex-col gap-1.5 rounded-xl border border-black/10 p-5 transition hover:border-indigo-400 dark:border-white/15"
                    >
                      <span className="font-semibold">{other.name}</span>
                      <span className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{alt.why}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/models" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Compare every AI video model
              </Link>
            </p>
          </Section>

          {tools.length > 0 && (
            <Section id="tools" title={`Use ${page.name} for`}>
              <ul className="flex flex-wrap gap-2">
                {tools.map((l) => (
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

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={faqs} />
          </Section>
        </article>
      </main>
      <SiteFooter className="pb-12" />
    </>
  );
}

function Specs({
  page,
  model,
  spec,
}: {
  page: ModelPage;
  model: RunwareModel;
  spec: (typeof modelSpecs)[number];
}) {
  const ratios = aspectRatios(model);
  const fps = model.input.fps;
  const rows: [string, string][] = [
    ["Made by", page.maker],
    ["Clip length", spec.minSeconds && spec.maxSeconds ? `${spec.minSeconds} to ${spec.maxSeconds} seconds` : "–"],
    ["Resolutions", priceTiers(model).map((t) => t.tier).join(", ")],
    ["Shapes", ratios.length > 0 ? ratios.join(", ") : "Any size (custom width and height)"],
    ["Starts from", spec.inputs.join(", ")],
    ["Extra inputs", inputs(model).join(", ") || "–"],
    ["Sound", page.audio ? "Generated with the video" : "No native audio"],
  ];
  if (fps) {
    const options = fps.enum as number[] | undefined;
    rows.push(["Frame rate", options ? `${options.join(", ")} fps` : `${fps.minimum} to ${fps.maximum} fps`]);
  }
  return (
    <dl className="divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/15 dark:border-white/15">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</dt>
          <dd className="leading-7">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** What each attachment slot takes, in words, from the model's `inputs` schema. */
function inputs(model: RunwareModel): string[] {
  const props = model.input.inputs?.properties ?? {};
  const max = (key: string) => props[key]?.maxItems as number | undefined;
  const plural = (n: number | undefined, one: string, many: string) => (n && n > 1 ? `up to ${n} ${many}` : one);
  const out: string[] = [];
  if (props.frameImages) {
    const n = max("frameImages");
    out.push(n === 1 ? "a first frame" : n === 2 ? "first and last frames" : `up to ${n} keyframes`);
  }
  if (props.referenceImages) out.push(plural(max("referenceImages"), "a reference image", "reference images"));
  if (props.referenceVideos) out.push(plural(max("referenceVideos"), "a reference video", "reference videos"));
  if (props.referenceAudios) out.push(plural(max("referenceAudios"), "a reference audio clip", "reference audio clips"));
  if (props.video) out.push("an input video");
  if (props.audio) out.push("an audio track");
  if (props.documents || props.urls) out.push("a document or web page");
  const text = out.join(", ");
  return text ? [text.charAt(0).toUpperCase() + text.slice(1)] : [];
}

function Pricing({ model, short }: { model: RunwareModel; short: number }) {
  const pricing = model.pricing;
  const tiers = priceTiers(model);
  const checked = pricing?.checked;
  return (
    <>
      <Table
        caption={`${model.name} price per resolution`}
        head={["Resolution", "Per second", `${short}-second clip`, "10-second clip"]}
        rows={tiers.map((t) => [t.tier, usd(t.perSecond), usd(t.perSecond * short), usd(t.perSecond * 10)])}
      />
      <Paragraphs
        items={[
          [
            pricing?.approximate
              ? "This model is billed per token, so these are close approximations."
              : "These are the published per-second rates.",
            "The composer shows the exact estimate for your settings before you generate, and failed generations aren't charged.",
            checked ? `Prices last checked ${formatDate(checked)}.` : "",
            "Credits come with our [plans](/pricing).",
          ]
            .filter(Boolean)
            .join(" "),
        ]}
      />
    </>
  );
}

function costFaq(page: ModelPage, model: RunwareModel, short: number): Faq {
  const tiers = priceTiers(model);
  const low = tiers[0];
  const high = tiers.at(-1)!;
  return {
    q: `How much does ${page.name} cost?`,
    a:
      low === high
        ? `A flat ${usd(low.perSecond)} a second, so a ${short}-second clip is about ${usd(low.perSecond * short)}.`
        : `From ${usd(low.perSecond)} a second at ${low.tier} to ${usd(high.perSecond)} at ${high.tier}. A ${short}-second ${low.tier} clip costs about ${usd(low.perSecond * short)}.`,
  };
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
}
