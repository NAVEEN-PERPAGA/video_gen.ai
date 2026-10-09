"use server";

import { redirect } from "next/navigation";
import type { Generation } from "@/app/generate/actions";
import { ApiError, apiFetch, apiFetchPage, apiSend, errorMessages } from "@/lib/api";
import { emptyTimeline, type MediaRef, mediaKey, type Timeline } from "@/lib/editor/timeline";
import type { Upload } from "@/lib/uploads";

/** A video editor project as node_scalable returns it (/workspaces/:id/projects). */
export interface Project {
  id: number;
  workspaceId: number;
  createdBy: string | null;
  name: string;
  timeline: Timeline;
  /** Send it back with the next save: the API refuses a save based on an older version. */
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** A project in a list: no timeline, but a summary of it. */
export type ProjectSummary = Omit<Project, "timeline"> & { durationSeconds: number; clipCount: number };

/** An export of a project (/workspaces/:id/renders). The video goes on generation `generationId`. */
export interface Render {
  id: number;
  workspaceId: number;
  projectId: number | null;
  generationId: number;
  status: "queued" | "rendering" | "completed" | "failed";
  /** 0 to 1. */
  progress: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

/**
 * Server Functions are public endpoints: ids must really be ids before they
 * go into an API path.
 */
function validId(...ids: number[]) {
  return ids.every((id) => Number.isSafeInteger(id) && id > 0);
}

const BAD_REQUEST = { error: "Invalid request." };

export async function listProjects(
  workspaceId: number,
  cursor: number | null = null,
): Promise<{ projects: ProjectSummary[]; nextCursor: number | null; error?: undefined } | { error: string }> {
  if (!validId(workspaceId)) return BAD_REQUEST;
  try {
    const page = await apiFetchPage<ProjectSummary>(`/workspaces/${workspaceId}/projects`, { limit: 50, cursor });
    return { projects: page.items, nextCursor: page.nextCursor as number | null };
  } catch (err) {
    return { error: errorMessages(err, "Could not load the projects.").join(" ") };
  }
}

export async function getProject(workspaceId: number, projectId: number): Promise<Project | null> {
  if (!validId(workspaceId, projectId)) return null;
  try {
    return await apiFetch<Project>(`/workspaces/${workspaceId}/projects/${projectId}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Creates a project, empty or with a starting timeline (e.g. a generation opened in the editor). */
export async function createProject(
  workspaceId: number,
  name: string,
  timeline: Timeline = emptyTimeline(),
): Promise<{ project: Project; error?: undefined } | { error: string }> {
  if (!validId(workspaceId)) return BAD_REQUEST;
  try {
    const project = await apiFetch<Project>(`/workspaces/${workspaceId}/projects`, {
      method: "POST",
      body: JSON.stringify({ name, timeline }),
    });
    return { project };
  } catch (err) {
    return { error: errorMessages(err, "Could not create the project.").join(" ") };
  }
}

/** The "New project" form on /edit: creates an empty project and opens it. */
export async function createProjectAndOpen(formData: FormData): Promise<void> {
  const workspaceId = Number(formData.get("workspaceId"));
  const aspect = String(formData.get("aspect") ?? "16:9");
  const result = await createProject(
    workspaceId,
    "Untitled project",
    emptyTimeline(aspect === "9:16" || aspect === "1:1" ? aspect : "16:9"),
  );
  if (result.error !== undefined) redirect(`/edit?workspace=${workspaceId}&error=create`);
  redirect(`/edit/${result.project.id}?workspace=${workspaceId}`);
}

export type SaveResult =
  | { project: Project; error?: undefined; conflict?: undefined }
  | { error: string; conflict?: boolean };

/**
 * Saves the timeline and/or name. `version` is the version being edited:
 * if the project was saved elsewhere since, nothing is saved and `conflict` is set.
 */
export async function saveProject(
  workspaceId: number,
  projectId: number,
  version: number,
  changes: { name?: string; timeline?: Timeline },
): Promise<SaveResult> {
  if (!validId(workspaceId, projectId)) return BAD_REQUEST;
  try {
    const project = await apiFetch<Project>(`/workspaces/${workspaceId}/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ version, ...changes }),
    });
    return { project };
  } catch (err) {
    if (err instanceof ApiError && err.code === "VERSION_CONFLICT") return { error: err.message, conflict: true };
    return { error: errorMessages(err, "Could not save the project.").join(" ") };
  }
}

/** Deletes a project. Members can delete their own; admins and owners anyone's (the API enforces this). */
export async function deleteProject(workspaceId: number, projectId: number): Promise<{ error?: string }> {
  if (!validId(workspaceId, projectId)) return BAD_REQUEST;
  try {
    await apiSend(`/workspaces/${workspaceId}/projects/${projectId}`, { method: "DELETE" });
    return {};
  } catch (err) {
    return { error: errorMessages(err, "Could not delete the project.").join(" ") };
  }
}

/** Queues an export of the project as last saved. Poll `getRender` for its progress. */
export async function startRender(
  workspaceId: number,
  projectId: number,
): Promise<{ render: Render; error?: undefined } | { error: string }> {
  if (!validId(workspaceId, projectId)) return BAD_REQUEST;
  try {
    const render = await apiFetch<Render>(`/workspaces/${workspaceId}/renders`, {
      method: "POST",
      body: JSON.stringify({ projectId }),
    });
    return { render };
  } catch (err) {
    return { error: errorMessages(err, "Could not start the export.").join(" ") };
  }
}

/** An export's progress; once completed, `video` is the finished file's URL. */
export async function getRender(
  workspaceId: number,
  renderId: number,
): Promise<{ render: Render; video?: string; error?: undefined } | { error: string }> {
  if (!validId(workspaceId, renderId)) return BAD_REQUEST;
  try {
    const render = await apiFetch<Render>(`/workspaces/${workspaceId}/renders/${renderId}`);
    if (render.status !== "completed") return { render };
    const generation = await apiFetch<Generation>(`/workspaces/${workspaceId}/generations/${render.generationId}`);
    return { render, video: generation.videoUrls[0] };
  } catch (err) {
    return { error: errorMessages(err, "Could not check the export.").join(" ") };
  }
}

/** One page of the workspace's uploads (videos, images and audio), newest first. */
export async function listUploads(
  workspaceId: number,
  cursor: number | null = null,
): Promise<{ uploads: Upload[]; nextCursor: number | null; error?: undefined } | { error: string }> {
  if (!validId(workspaceId)) return BAD_REQUEST;
  try {
    const page = await apiFetchPage<Upload>(`/workspaces/${workspaceId}/uploads`, { limit: 24, cursor });
    return { uploads: page.items, nextCursor: page.nextCursor as number | null };
  } catch (err) {
    return { error: errorMessages(err, "Could not load the uploads.").join(" ") };
  }
}

/**
 * Fresh URLs for media used by a timeline, keyed by mediaKey. Media that's
 * gone (deleted, or not finished) is left out. Called when a project opens,
 * and again before stored links expire.
 */
export async function resolveSources(workspaceId: number, refs: MediaRef[]): Promise<Record<string, string>> {
  if (!validId(workspaceId)) return {};
  const unique = new Map(refs.filter((r) => validId(r.id)).map((r) => [mediaKey(r), r]));
  const entries = await Promise.all(
    [...unique].map(async ([key, ref]) => {
      try {
        if (ref.type === "upload") {
          const upload = await apiFetch<Upload>(`/workspaces/${workspaceId}/uploads/${ref.id}`);
          return [key, upload.url] as const;
        }
        const g = await apiFetch<Generation>(`/workspaces/${workspaceId}/generations/${ref.id}`);
        return [key, (g.mediaType === "image" ? g.imageUrls : g.videoUrls)[ref.index] ?? null] as const;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return [key, null] as const;
        throw err;
      }
    }),
  );
  return Object.fromEntries(entries.filter((e): e is readonly [string, string] => typeof e[1] === "string"));
}
