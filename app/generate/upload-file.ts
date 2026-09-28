import { type Upload, type UploadTarget, uploadsPath } from "@/lib/uploads";

/** How long the create/complete calls may take before we give up. */
const API_TIMEOUT_MS = 30_000;

/**
 * Uploads an image or video file from the browser to workspace storage:
 *   1. POST /api/workspaces/:id/uploads registers it and returns a presigned PUT URL;
 *   2. the file goes straight from the browser to storage (Cloudflare R2),
 *      never through this app's server, with progress reported on the way;
 *   3. POST .../uploads/:uploadId/complete has the API confirm it and return its URL.
 * `onCreated` hears the upload id as soon as it exists, so a cancelled
 * upload can be deleted. Rejects with a readable Error, or an AbortError.
 */
export async function uploadFile(
  workspaceId: number,
  file: File,
  {
    signal,
    onCreated,
    onProgress,
  }: { signal: AbortSignal; onCreated: (uploadId: number) => void; onProgress: (share: number) => void },
): Promise<Upload> {
  const created = await callApi<{ data: Upload; meta: { upload: UploadTarget } }>(
    uploadsPath(workspaceId),
    { method: "POST", body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }) },
    signal,
    "Could not start the upload.",
  );
  onCreated(created.data.id);

  await put(file, created.meta.upload, signal, onProgress);

  const completed = await callApi<{ data: Upload }>(
    uploadsPath(workspaceId, created.data.id, "complete"),
    { method: "POST" },
    signal,
    "Could not finish the upload.",
  );
  return completed.data;
}

/** Deletes an upload nothing will use (best effort; it's only storage). */
export function deleteUpload(workspaceId: number, uploadId: number) {
  fetch(uploadsPath(workspaceId, uploadId), { method: "DELETE" }).catch(() => {});
}

/** A JSON call to this app's upload API, turning error answers into readable Errors. */
async function callApi<T>(path: string, init: RequestInit, signal: AbortSignal, fallback: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.any([signal, AbortSignal.timeout(API_TIMEOUT_MS)]),
    });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new Error(
      err instanceof DOMException && err.name === "TimeoutError"
        ? `${fallback} The server took too long to answer.`
        : `${fallback} Check your connection and try again.`,
    );
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorMessage(body) ?? `${fallback} (HTTP ${res.status})`);
  return body as T;
}

/** The API's `{ error: { message, details } }`, with per-field details such as "size: too big". */
function errorMessage(body: unknown): string | undefined {
  const error = (body as { error?: { message?: string; details?: unknown } } | null)?.error;
  if (!error?.message) return undefined;
  const { details } = error;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    const fields = Object.entries(details as Record<string, unknown>)
      .map(([path, messages]) => `${path.replace(/^\//, "")}: ${[messages].flat().join(", ")}`)
      .join("; ");
    if (fields) return `${error.message} (${fields})`;
  }
  return error.message;
}

/** XMLHttpRequest rather than fetch(): it's the only way to see upload progress. */
function put(file: File, target: UploadTarget, signal: AbortSignal, onProgress: (share: number) => void) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Upload cancelled", "AbortError"));
    const xhr = new XMLHttpRequest();
    xhr.open(target.method, target.url);
    // Exactly the signed headers; the browser adds Content-Length itself.
    for (const [name, value] of Object.entries(target.headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Storage rejected the upload (HTTP ${xhr.status}).`));
    // A CORS rejection by the storage bucket also lands here, with no details.
    xhr.onerror = () =>
      reject(new Error("Could not send the file to storage. Check your connection, or the bucket's CORS settings."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}
