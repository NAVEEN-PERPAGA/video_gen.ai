import { HomePage } from "@/app/_seo/home-page";
import { toolMetadata } from "@/app/_seo/tool-page";
import { home } from "@/app/_seo/tools";

export const metadata = toolMetadata(home);

/** The AI video generator landing page; the studio itself is at /generate. */
export default function Page() {
  return <HomePage />;
}
