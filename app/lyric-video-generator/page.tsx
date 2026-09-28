import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { lyricVideo } from "@/app/_seo/tools";

export const metadata = toolMetadata(lyricVideo);

export default function Page({ searchParams }: PageProps<"/lyric-video-generator">) {
  return <ToolPage tool={lyricVideo} searchParams={searchParams} />;
}
