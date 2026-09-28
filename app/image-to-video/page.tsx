import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { imageToVideo } from "@/app/_seo/tools";

export const metadata = toolMetadata(imageToVideo);

export default function Page({ searchParams }: PageProps<"/image-to-video">) {
  return <ToolPage tool={imageToVideo} searchParams={searchParams} />;
}
