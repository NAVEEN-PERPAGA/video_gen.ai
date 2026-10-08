import type { Metadata } from "next";
import { tools } from "@/app/_seo/tools";
import { WorkspaceShell } from "@/app/workspace-shell";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

/**
 * The studio: workspaces, gallery and composer. Tool pages link here with
 * ?tool=<their slug> (and ?prompt= from their prompt box) to open the
 * composer with that page's preset.
 */
export default async function GeneratePage({ searchParams }: PageProps<"/generate">) {
  const { tool, prompt } = await searchParams;
  const content = typeof tool === "string" ? tools.find((t) => t.path === `/${tool}`) : undefined;
  const text = typeof prompt === "string" ? prompt.trim() : "";

  return (
    <WorkspaceShell
      path="/generate"
      query={content ? { tool: content.path.slice(1) } : {}}
      searchParams={searchParams}
      preset={{ ...content?.preset, ...(text && { prompt: text }) }}
    />
  );
}
