"use server";

import { randomUUID } from "node:crypto";
import { ApiError, apiFetch, apiFetchPage } from "@/lib/api";
import { getVideoModel } from "@/lib/runware/models";
import { buildTask, type ComposerValues, validateTask } from "@/lib/runware/request";
import type { Upload } from "@/lib/uploads";

/** A generation as node_scalable returns it (GET/POST .../generations). */
export interface Generation {
  id: number;
  workspaceId: number;
  status: "processing" | "completed" | "failed";
  model: string | null;
  videoUrls: string[];
  /** For Runware videos, `{ taskType, request }` where `request` is the task that was sent. */
  videoMetadata: { request?: { positivePrompt?: string } } & Record<string, unknown>;
  /** Why the task failed (or partly failed). */
  error: string | null;
  /** Provider cost in USD, when reported. */
  cost: number | null;
  completedAt: string | null;
  createdAt: string;
}

export type GenerateState = { errors?: string[]; generation?: Generation } | undefined;

/**
 * Task fields node_scalable sets itself and rejects if the client sends them
 * (SERVER_FIELDS in its video-models registry).
 */
const SERVER_FIELDS = ["taskType", "taskUUID", "deliveryMethod", "includeCost", "webhookURL", "uploadEndpoint"];

/**
 * Starts a video generation (text/image to video, or an edit when the task
 * has an input video) in `workspaceId`. The API answers 202 with a
 * 'processing' generation; poll `getGeneration` for the result.
 */
export async function generateVideo(
  workspaceId: number,
  modelId: string,
  values: ComposerValues,
): Promise<GenerateState> {
  const model = getVideoModel(modelId);
  if (!model) return { errors: ["Unknown model."] };

  // Uploaded videos' links expire; swap in fresh ones so Runware can fetch them.
  try {
    values = await withFreshUploadUrls(workspaceId, values);
  } catch (err) {
    return { errors: errorMessages(err, "Could not read an uploaded video.") };
  }

  // Re-check on the server: the client-side hints can be bypassed.
  const task = buildTask(model, values, randomUUID());
  const errors = validateTask(model, values, task);
  if (errors.length > 0) return { errors };

  const body = Object.fromEntries(Object.entries(task).filter(([key]) => !SERVER_FIELDS.includes(key)));
  try {
    const generation = await apiFetch<Generation>(`/workspaces/${workspaceId}/generations/video`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { generation };
  } catch (err) {
    return { errors: errorMessages(err, "Could not start the generation.") };
  }
}

export type GenerationsPage =
  | { generations: Generation[]; nextCursor: number | null; error?: undefined }
  | { error: string };

/** How many generations one page of the gallery loads. */
const GENERATIONS_PAGE_SIZE = 24;

/**
 * One page of `workspaceId`'s generations, newest first. Pass the previous
 * page's `nextCursor` to continue. The list reports stored statuses only;
 * poll `getGeneration` to move a processing one along.
 */
export async function listGenerations(workspaceId: number, cursor: number | null = null): Promise<GenerationsPage> {
  try {
    const page = await apiFetchPage<Generation>(`/workspaces/${workspaceId}/generations`, {
      limit: GENERATIONS_PAGE_SIZE,
      cursor,
    });
    return { generations: page.items, nextCursor: page.nextCursor as number | null };
  } catch (err) {
    return { error: errorMessages(err, "Could not load the generations.").join(" ") };
  }
}

/** Polls a generation; the API checks Runware for the task's status as it answers. */
export async function getGeneration(workspaceId: number, generationId: number): Promise<GenerateState> {
  try {
    return { generation: await apiFetch<Generation>(`/workspaces/${workspaceId}/generations/${generationId}`) };
  } catch (err) {
    return { errors: errorMessages(err, "Could not check the generation.") };
  }
}

/**
 * Replaces each uploaded video's URL with a freshly signed one from the API,
 * which also proves the upload belongs to this workspace.
 */
async function withFreshUploadUrls(workspaceId: number, values: ComposerValues): Promise<ComposerValues> {
  const assets = Object.fromEntries(
    await Promise.all(
      Object.entries(values.assets).map(async ([key, items]) => [
        key,
        await Promise.all(
          items.map(async (item) => {
            if (item.uploadId === undefined) return item;
            const upload = await apiFetch<Upload>(`/workspaces/${workspaceId}/uploads/${item.uploadId}`);
            if (upload.status !== "uploaded" || !upload.url) {
              throw new ApiError(409, `${item.name ?? "A video"} has not finished uploading.`);
            }
            return { ...item, value: upload.url };
          }),
        ),
      ]),
    ),
  );
  return { ...values, assets };
}

/** The API's message plus any per-field (VALIDATION_ERROR) or provider (PROVIDER_REJECTED) details. */
function errorMessages(err: unknown, fallback: string): string[] {
  if (!(err instanceof ApiError)) {
    console.error(fallback, err);
    // fetch() rejects with a TypeError when the API can't be reached at all.
    return [err instanceof TypeError ? `${fallback} The API server is unreachable.` : fallback];
  }
  const { details } = err;
  const lines: string[] = [];
  if (Array.isArray(details)) {
    for (const d of details as { message?: string; code?: string }[]) {
      const line = d?.message ?? d?.code;
      if (line) lines.push(line);
    }
  } else if (details && typeof details === "object") {
    for (const [path, messages] of Object.entries(details as Record<string, unknown>)) {
      const field = path.replace(/^\//, "").replace(/\//g, ".") || "request";
      for (const m of Array.isArray(messages) ? messages : [messages]) lines.push(`${field}: ${String(m)}`);
    }
  }
  return lines.length > 0 ? lines : [err.message];
}
