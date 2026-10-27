import type { Metadata } from "next";
import { modelPageBySlug } from "@/app/_seo/model-pages";
import { tools } from "@/app/_seo/tools";
import { WorkspaceShell } from "@/app/workspace-shell";
import { defaultModelIds } from "@/lib/runware/models";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

/**
 * The studio: workspaces, gallery and composer. Tool pages link here with
 * ?tool=<their slug>, model pages with ?model=<model slug>, and both send
 * ?prompt= from their prompt box, to open the composer ready to go.
 * The home page's box can send ?mode=image to open in image mode.
 */
export default async function GeneratePage({ searchParams }: PageProps<"/generate">) {
  const { tool, model, prompt, mode } = await searchParams;
  const content = typeof tool === "string" ? tools.find((t) => t.path === `/${tool}`) : undefined;
  const modelPage = typeof model === "string" ? modelPageBySlug(model) : undefined;
  const imageMode = mode === "image" && !modelPage;
  const text = typeof prompt === "string" ? prompt.trim() : "";

  return (
    <WorkspaceShell
      path="/generate"
      query={{
        ...(content && { tool: content.path.slice(1) }),
        ...(modelPage && { model: modelPage.slug }),
        ...(imageMode && { mode: "image" }),
      }}
      searchParams={searchParams}
      preset={{
        ...content?.preset,
        ...(modelPage && { modelId: modelPage.id }),
        ...(imageMode && { modelId: defaultModelIds.image }),
        ...(text && { prompt: text }),
      }}
    />
  );
}
