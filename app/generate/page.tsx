import type { Metadata } from "next";
import { modelPageBySlug } from "@/app/_seo/model-pages";
import { tools } from "@/app/_seo/tools";
import { WorkspaceShell } from "@/app/workspace-shell";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

/**
 * The studio: workspaces, gallery and composer. Tool pages link here with
 * ?tool=<their slug>, model pages with ?model=<model slug>, and both send
 * ?prompt= from their prompt box, to open the composer ready to go.
 */
export default async function GeneratePage({ searchParams }: PageProps<"/generate">) {
  const { tool, model, prompt } = await searchParams;
  const content = typeof tool === "string" ? tools.find((t) => t.path === `/${tool}`) : undefined;
  const modelPage = typeof model === "string" ? modelPageBySlug(model) : undefined;
  const text = typeof prompt === "string" ? prompt.trim() : "";

  return (
    <WorkspaceShell
      path="/generate"
      query={{
        ...(content && { tool: content.path.slice(1) }),
        ...(modelPage && { model: modelPage.slug }),
      }}
      searchParams={searchParams}
      preset={{
        ...content?.preset,
        ...(modelPage && { modelId: modelPage.id }),
        ...(text && { prompt: text }),
      }}
    />
  );
}
