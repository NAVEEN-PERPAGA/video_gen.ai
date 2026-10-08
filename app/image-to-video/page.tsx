import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { imageToVideo } from "@/app/_seo/tools";

export const metadata = toolMetadata(imageToVideo);

export default function Page() {
  return <ToolPage tool={imageToVideo} />;
}
