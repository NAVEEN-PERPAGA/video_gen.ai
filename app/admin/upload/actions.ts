"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchPage, apiFetchWithMeta, apiSend, errorMessages } from "@/lib/api";
import type { ExploreVideo } from "@/lib/explore";
import type { UploadTarget } from "@/lib/uploads";

/** What the admin fills in for a new /explore video, plus the file's details. */
export interface NewExploreVideo {
  title: string;
  description: string;
  prompt: string;
  model: string;
  fileName: string;
  contentType: string;
  size: number;
}

export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Registers a video (pending) and returns where the browser PUTs the file.
 * The API answers 403 for anyone who isn't a site admin.
 */
export async function startExploreUpload(
  input: NewExploreVideo,
): Promise<ActionResult<{ video: ExploreVideo; target: UploadTarget }>> {
  try {
    const { data, meta } = await apiFetchWithMeta<ExploreVideo, { upload: UploadTarget }>("/admin/explore-videos", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { ok: true, value: { video: data, target: meta.upload } };
  } catch (err) {
    return { ok: false, error: errorMessages(err, "Could not start the upload.").join(" ") };
  }
}

/** A video already in the uploads bucket (e.g. put there from the Cloudflare dashboard). */
export interface ImportedExploreVideo {
  objectKey: string;
  title: string;
  description: string;
  prompt: string;
  model: string;
  /** Defaults to the key's last segment. */
  fileName?: string;
}

/** Publishes a video that's already in R2: the API reads its size and type from storage. */
export async function importExploreVideo(input: ImportedExploreVideo): Promise<ActionResult<ExploreVideo>> {
  try {
    const video = await apiFetch<ExploreVideo>("/admin/explore-videos/import", {
      method: "POST",
      body: JSON.stringify(input),
    });
    revalidatePath("/explore");
    revalidatePath("/admin/upload");
    return { ok: true, value: video };
  } catch (err) {
    return { ok: false, error: errorMessages(err, "Could not add the video.").join(" ") };
  }
}

/** Has the API confirm the file is in storage, which publishes it on /explore. */
export async function completeExploreUpload(videoId: number): Promise<ActionResult<ExploreVideo>> {
  try {
    const video = await apiFetch<ExploreVideo>(`/admin/explore-videos/${videoId}/complete`, { method: "POST" });
    revalidatePath("/explore");
    revalidatePath("/admin/upload");
    return { ok: true, value: video };
  } catch (err) {
    return { ok: false, error: errorMessages(err, "Could not finish the upload.").join(" ") };
  }
}

/** A video's editable details. Empty optional text clears that field. */
export interface ExploreVideoDetails {
  title: string;
  description: string;
  prompt: string;
  model: string;
  fileName: string;
}

/** Saves edited details; the file itself stays the same. */
export async function updateExploreVideo(
  videoId: number,
  details: ExploreVideoDetails,
): Promise<ActionResult<ExploreVideo>> {
  try {
    const video = await apiFetch<ExploreVideo>(`/admin/explore-videos/${videoId}`, {
      method: "PATCH",
      body: JSON.stringify(details),
    });
    revalidatePath("/explore");
    revalidatePath("/admin/upload");
    return { ok: true, value: video };
  } catch (err) {
    return { ok: false, error: errorMessages(err, "Could not save the changes.").join(" ") };
  }
}

/** Removes a video (and its file) from /explore. */
export async function deleteExploreVideo(videoId: number): Promise<ActionResult<null>> {
  try {
    await apiSend(`/admin/explore-videos/${videoId}`, { method: "DELETE" });
    revalidatePath("/explore");
    revalidatePath("/admin/upload");
    return { ok: true, value: null };
  } catch (err) {
    return { ok: false, error: errorMessages(err, "Could not delete the video.").join(" ") };
  }
}

/**
 * Whether the signed-in user is a site admin, for showing admin controls on
 * public pages. The API has no direct check, so this asks for the admin list
 * (403 for everyone else). Signed out or any error counts as "no".
 */
export async function isSiteAdmin(): Promise<boolean> {
  try {
    await apiFetchPage<ExploreVideo>("/admin/explore-videos", { limit: 1 });
    return true;
  } catch {
    return false;
  }
}
