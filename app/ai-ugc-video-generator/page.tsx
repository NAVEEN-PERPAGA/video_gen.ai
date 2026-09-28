import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { ugcVideo } from "@/app/_seo/tools";

export const metadata = toolMetadata(ugcVideo);

export default function Page({ searchParams }: PageProps<"/ai-ugc-video-generator">) {
  return <ToolPage tool={ugcVideo} searchParams={searchParams} />;
}
