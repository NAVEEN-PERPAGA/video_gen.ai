import type { ReactNode } from "react";
import type { Faq } from "@/app/_seo/json-ld";
import { RichText } from "@/app/_seo/rich-text";

/** Shared building blocks for the article below a tool, and for guides. */

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Paragraphs({ items }: { items: string[] }) {
  return items.map((p, i) => (
    <p key={i} className="leading-7 text-zinc-700 dark:text-zinc-300">
      <RichText text={p} />
    </p>
  ));
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 leading-7 text-zinc-700 marker:text-indigo-500 dark:text-zinc-300">
      {items.map((b, i) => (
        <li key={i}>
          <RichText text={b} />
        </li>
      ))}
    </ul>
  );
}

export function Steps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.title} className="flex flex-col gap-2 rounded-xl border border-black/10 p-5 dark:border-white/15">
          <span className="flex size-8 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            {i + 1}
          </span>
          <h3 className="font-semibold">{s.title}</h3>
          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            <RichText text={s.body} />
          </p>
        </li>
      ))}
    </ol>
  );
}

export function Cards({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((c) => (
        <li key={c.title} className="rounded-xl border border-black/10 p-5 dark:border-white/15">
          <h3 className="mb-1.5 font-semibold">{c.title}</h3>
          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            <RichText text={c.body} />
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Native <details>, so answers are in the HTML (for crawlers) but folded for readers. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/15 dark:border-white/15">
      {faqs.map((f) => (
        <details key={f.q} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
            <h3>{f.q}</h3>
            <span aria-hidden="true" className="text-zinc-500 transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
            <RichText text={f.a} />
          </p>
        </details>
      ))}
    </div>
  );
}
