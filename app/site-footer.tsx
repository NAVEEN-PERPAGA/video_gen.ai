import Link from "next/link";
import { blogLinks, SITE_NAME, toolLinks } from "@/lib/site";

/** Links every tool page and guide, so each page is reachable (and crawlable) from every other. */
export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t border-black/10 dark:border-white/15 ${className}`}>
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 pt-10 text-sm sm:grid-cols-[1fr_auto_auto]">
        <div>
          <Link href="/" className="font-semibold">
            {SITE_NAME}
          </Link>
          <p className="mt-2 max-w-xs text-zinc-600 dark:text-zinc-400">
            Generate and edit videos with the latest AI models, from text, images or audio.
          </p>
        </div>
        <nav aria-label="Tools">
          <h2 className="mb-3 font-medium">Tools</h2>
          <ul className="flex flex-col gap-2 text-zinc-600 dark:text-zinc-400">
            {toolLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Guides">
          <h2 className="mb-3 font-medium">
            <Link href="/blog" className="hover:underline">
              Guides
            </Link>
          </h2>
          <ul className="flex flex-col gap-2 text-zinc-600 dark:text-zinc-400">
            {blogLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
