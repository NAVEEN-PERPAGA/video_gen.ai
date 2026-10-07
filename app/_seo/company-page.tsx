import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlainHeader } from "@/app/_seo/article";
import { Bullets, Paragraphs } from "@/app/_seo/sections";
import { SiteFooter } from "@/app/site-footer";
import { OG_IMAGE } from "@/lib/site";

/** When the legal pages last changed. Bump it with every edit to their text. */
export const LEGAL_UPDATED = "2026-09-28";

export function companyMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** About, contact and legal pages: the site header, a title, the text, and the footer. */
export function CompanyPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  /** ISO date; shown as "Last updated" on legal pages. */
  updated?: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PlainHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-20">
        <header className="mb-10 flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {updated && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Last updated{" "}
              <time dateTime={updated}>
                {new Date(`${updated}T00:00:00Z`).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" })}
              </time>
            </p>
          )}
          {intro && <Paragraphs items={[intro]} />}
        </header>
        <div className="flex flex-col gap-10">{children}</div>
      </main>
      <SiteFooter className="pb-12" />
    </>
  );
}

/** One numbered-feeling block of a policy: a heading, paragraphs, then an optional list. */
export function Clause({
  title,
  paragraphs = [],
  bullets,
  after = [],
}: {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Paragraphs that follow the list. */
  after?: string[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <Paragraphs items={paragraphs} />
      {bullets && <Bullets items={bullets} />}
      <Paragraphs items={after} />
    </section>
  );
}
