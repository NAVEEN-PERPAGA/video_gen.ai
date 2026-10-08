import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { lyricVideo } from "@/app/_seo/tools";

export const metadata = toolMetadata(lyricVideo);

export default function Page() {
  return <ToolPage tool={lyricVideo} />;
}
