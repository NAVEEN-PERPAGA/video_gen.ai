import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { textToVideo } from "@/app/_seo/tools";

export const metadata = toolMetadata(textToVideo);

export default function Page({ searchParams }: PageProps<"/text-to-video">) {
  return <ToolPage tool={textToVideo} searchParams={searchParams} />;
}
