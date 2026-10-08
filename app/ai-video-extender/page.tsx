import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { videoExtender } from "@/app/_seo/tools";

export const metadata = toolMetadata(videoExtender);

export default function Page() {
  return <ToolPage tool={videoExtender} />;
}
