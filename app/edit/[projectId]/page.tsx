import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProject, type Project, resolveSources } from "@/app/edit/actions";
import { apiFetchAll } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { Editor } from "./editor";

export const metadata: Metadata = {
  title: "Video editor",
  robots: { index: false, follow: false },
};

/**
 * The video editor for one project. Links carry ?workspace=<id> (the API
 * addresses projects within their workspace); without it, the project is
 * looked up in each of the user's workspaces. The media the timeline uses is
 * resolved to fresh URLs here, so the preview can start right away.
 */
export default async function EditorPage({ params, searchParams }: PageProps<"/edit/[projectId]">) {
  const [{ projectId }, { workspace }] = await Promise.all([params, searchParams]);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    const back = `/edit/${projectId}${typeof workspace === "string" ? `?workspace=${workspace}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  const id = Number(projectId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const project = await findProject(id, Number(workspace));
  if (!project) notFound();

  const media = [...project.timeline.clips.map((c) => c.media), ...project.timeline.audio.map((a) => a.media)];
  const sources = await resolveSources(project.workspaceId, media);

  // Keyed: opening another project starts the editor from scratch.
  return <Editor key={project.id} project={project} initialSources={sources} />;
}

async function findProject(projectId: number, hint: number): Promise<Project | null> {
  if (Number.isSafeInteger(hint) && hint > 0) {
    const project = await getProject(hint, projectId);
    if (project) return project;
  }
  const workspaces = await apiFetchAll<{ id: number }>("/workspaces");
  const found = await Promise.all(workspaces.filter((ws) => ws.id !== hint).map((ws) => getProject(ws.id, projectId)));
  return found.find((p) => p !== null) ?? null;
}
