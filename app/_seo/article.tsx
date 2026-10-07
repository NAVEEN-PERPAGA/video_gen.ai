import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ArticleInfo } from "@/app/_seo/articles";
import { type Faq, faqPageLd, JsonLd } from "@/app/_seo/json-ld";
import { FaqList, Section } from "@/app/_seo/sections";
import { SiteFooter } from "@/app/site-footer";
import { SiteLogo } from "@/app/site-logo";
import { absoluteUrl, OG_IMAGE, SITE_NAME } from "@/lib/site";

export function articleMetadata(article: ArticleInfo): Metadata {
  return {
    title: { absolute: article.title },
    description: article.description,
    alternates: { canonical: article.path },
    openGraph: {
      title: article.title,
      description: article.description,
      url: article.path,
      type: "article",
      publishedTime: article.published,
      modifiedTime: article.updated,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.description },
  };
}

/** Site header for pages without the studio: the brand and a way into the generator. */
export function PlainHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-background dark:border-white/15">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <SiteLogo className="text-sm font-semibold tracking-tight" />
        <nav aria-label="Site" className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="flex h-9 items-center rounded-md px-3 text-sm font-medium text-zinc-600 transition hover:text-foreground dark:text-zinc-400"
          >
            Pricing
          </Link>
          <Link
            href="/"
            className="flex h-9 items-center rounded-md bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            <span className="sm:hidden">Try it</span>
            <span className="hidden sm:inline">Try the AI video generator</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
}

/** A blog post: breadcrumb, H1 and dates, the body, an FAQ, and a call to action, with BlogPosting and FAQPage JSON-LD. */
export function Article({ article, faqs, children }: { article: ArticleInfo; faqs: Faq[]; children: ReactNode }) {
  return (
    <>
      <PlainHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: article.h1,
          description: article.description,
          datePublished: article.published,
          dateModified: article.updated,
          mainEntityOfPage: absoluteUrl(article.path),
          author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
          publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
        }}
      />
      <JsonLd data={faqPageLd(faqs)} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-20">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/blog" className="hover:underline">
            Guides
          </Link>
        </nav>
        <article className="flex flex-col gap-12">
          <header className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{article.h1}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              By the {SITE_NAME} team · Updated <time dateTime={article.updated}>{formatDate(article.updated)}</time>
            </p>
          </header>

          {children}

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={faqs} />
          </Section>

          <aside className="flex flex-col items-start gap-4 rounded-2xl bg-indigo-600 p-8 text-white">
            <p className="text-xl font-semibold">Make your first AI video</p>
            <p className="text-indigo-100">
              Try Seedance, Wan, LTX, MiniMax and Gemini models in one place, and see what each clip costs before you
              generate it.
            </p>
            <Link
              href="/"
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Open the AI video generator
            </Link>
          </aside>
        </article>
      </main>
      <SiteFooter className="pb-12" />
    </>
  );
}
