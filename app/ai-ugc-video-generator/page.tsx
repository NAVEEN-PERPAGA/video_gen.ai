import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { ugcVideo } from "@/app/_seo/tools";

export const metadata = toolMetadata(ugcVideo);

export default function Page() {
  return <ToolPage tool={ugcVideo} />;
}
