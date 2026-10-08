import type { Metadata } from "next";
import Link from "next/link";
import { PlainHeader } from "@/app/_seo/article";
import { articles } from "@/app/_seo/articles";
import { SiteFooter } from "@/app/site-footer";

export const metadata: Metadata = {
  title: "AI Video Guides",
  description: "Practical guides to making videos with AI: writing prompts, choosing a model, free options, and step-by-step walkthroughs.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <>
      <PlainHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-20">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">AI video guides</h1>
        <ul className="flex flex-col gap-4">
          {articles.map((a) => (
            <li key={a.path}>
              <Link
                href={a.path}
                className="block rounded-xl border border-black/10 p-6 transition hover:border-indigo-400 dark:border-white/15"
              >
                <h2 className="text-lg font-semibold">{a.h1}</h2>
                <p className="mt-2 text-zinc-700 dark:text-zinc-300">{a.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter className="pb-12" />
    </>
  );
}
