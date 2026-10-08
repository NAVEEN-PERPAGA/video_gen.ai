import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { videoEditor } from "@/app/_seo/tools";

export const metadata = toolMetadata(videoEditor);

export default function Page() {
  return <ToolPage tool={videoEditor} />;
}
