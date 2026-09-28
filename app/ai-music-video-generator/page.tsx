import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { musicVideo } from "@/app/_seo/tools";

export const metadata = toolMetadata(musicVideo);

export default function Page({ searchParams }: PageProps<"/ai-music-video-generator">) {
  return <ToolPage tool={musicVideo} searchParams={searchParams} />;
}
