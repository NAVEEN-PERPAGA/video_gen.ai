import { toolMetadata, ToolPage } from "@/app/_seo/tool-page";
import { home } from "@/app/_seo/tools";

export const metadata = toolMetadata(home);

/** The studio (workspaces, gallery and composer), with the AI video generator landing copy around it. */
export default function DashboardPage({ searchParams }: PageProps<"/">) {
  return <ToolPage tool={home} searchParams={searchParams} />;
}
