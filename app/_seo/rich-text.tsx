import Link from "next/link";
import { Fragment } from "react";

/** `[anchor text](/path)` inside content strings; how pages interlink with keyword anchors. */
const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/** A content string with its [links](/path) rendered as <Link>s. */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    parts.push(text.slice(last, match.index));
    const [, label, href] = match;
    parts.push(
      <Link key={match.index} href={href} className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">
        {label}
      </Link>,
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
}

/** The same string as plain text, for meta tags and JSON-LD. */
export function plainText(text: string) {
  return text.replace(LINK, "$1");
}
