import Link from "next/link";
import type { ReactNode } from "react";
import { blogLinks, companyLinks, toolLinks } from "@/lib/site";

/** Links every tool page, guide and company page, so each is reachable (and crawlable) from every other. */
export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t border-black/10 dark:border-white/15 ${className}`}>
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <LinkColumn label="Tools" title="Tools" links={toolLinks} />
        <LinkColumn
          label="Guides"
          title={
            <Link href="/blog" className="hover:underline">
              Guides
            </Link>
          }
          links={blogLinks}
        />
        <LinkColumn label="Company" title="Company" links={companyLinks} />
      </div>
    </footer>
  );
}

function LinkColumn({
  label,
  title,
  links,
}: {
  label: string;
  title: ReactNode;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <nav aria-label={label}>
      <h2 className="mb-3 font-medium">{title}</h2>
      <ul className="flex flex-col gap-2 text-zinc-600 dark:text-zinc-400">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
