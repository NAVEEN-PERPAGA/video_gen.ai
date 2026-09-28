import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { videoExtender } from "@/app/_seo/tools";

export const metadata = toolMetadata(videoExtender);

export default function Page({ searchParams }: PageProps<"/ai-video-extender">) {
  return <ToolPage tool={videoExtender} searchParams={searchParams} />;
}
