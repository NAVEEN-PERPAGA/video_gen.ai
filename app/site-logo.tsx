import Image from "next/image";
import Link from "next/link";
import { SITE_DISPLAY_NAME } from "@/lib/site";

/** Product mark plus name, linking home. */
export function SiteLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2 ${className}`}>
      <Image src="/logo.png" alt="" width={24} height={24} className="size-6" priority />
      {SITE_DISPLAY_NAME}
    </Link>
  );
}
