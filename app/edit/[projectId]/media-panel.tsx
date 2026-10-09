"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { listUploads } from "@/app/edit/actions";
import { type Generation, listGenerations } from "@/app/generate/actions";
import { MusicIcon, PlusIcon, UploadIcon } from "@/app/generate/icons";
import { deleteUpload, uploadFile } from "@/app/generate/upload-file";
import type { MediaRef } from "@/lib/editor/timeline";
import type { Upload } from "@/lib/uploads";

/** Something in the library that can go on the timeline. */
export interface LibraryItem {
  ref: MediaRef;
  kind: "video" | "image" | "audio";
  url: string;
  label: string;
}

/** What the upload button accepts (node_scalable's uploads.schema.ts takes these). */
const ACCEPT = "video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/flac";

/** A finished generation's outputs, one item each. */
function generationItems(g: Generation): LibraryItem[] {
  if (g.status !== "completed") return [];
  const urls = g.mediaType === "image" ? g.imageUrls : g.videoUrls;
  const meta = g.videoMetadata as { request?: { positivePrompt?: string }; project?: { name?: string } };
  const label = meta.request?.positivePrompt ?? (meta.project?.name ? `Export of ${meta.project.name}` : "Generation");
  return urls.map((url, index) => ({
    ref: { type: "generation", id: g.id, index },
    kind: g.mediaType,
    url,
    label,
  }));
}

function uploadItem(u: Upload): LibraryItem | null {
  if (u.status !== "uploaded" || !u.url || !u.kind) return null;
  return { ref: { type: "upload", id: u.id }, kind: u.kind, url: u.url, label: u.fileName };
}

/**
 * The workspace's media: its generations and its uploads, plus an upload
 * button. Clicking an item adds it to the timeline (videos and images to the
 * main track, audio at the playhead).
 */
export function MediaPanel({
  workspaceId,
  onAdd,
  adding,
}: {
  workspaceId: number;
  onAdd: (item: LibraryItem) => void;
  adding: boolean;
}) {
  const [tab, setTab] = useState<"generations" | "uploads">("generations");
  const [generations, setGenerations] = useState<{ items: LibraryItem[]; cursor: number | null } | null>(null);
  const [uploads, setUploads] = useState<{ items: LibraryItem[]; cursor: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, startLoadingMore] = useTransition();
  /** Uploads in progress: file name and share done. */
  const [uploading, setUploading] = useState<{ key: string; name: string; progress: number }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const aborts = useRef(new Set<AbortController>());

  useEffect(() => {
    let cancelled = false;
    void listGenerations(workspaceId).then((page) => {
      if (cancelled) return;
      if (page.error !== undefined) setError(page.error);
      else setGenerations({ items: page.generations.flatMap(generationItems), cursor: page.nextCursor });
    });
    void listUploads(workspaceId).then((page) => {
      if (cancelled) return;
      if (page.error !== undefined) setError(page.error);
      else setUploads({ items: page.uploads.map(uploadItem).filter((i) => i !== null), cursor: page.nextCursor });
    });
    const pending = aborts.current;
    return () => {
      cancelled = true;
      for (const abort of pending) abort.abort();
    };
  }, [workspaceId]);

  function loadMore() {
    startLoadingMore(async () => {
      if (tab === "generations" && generations?.cursor != null) {
        const page = await listGenerations(workspaceId, generations.cursor);
        if (page.error !== undefined) return setError(page.error);
        setGenerations((g) => ({
          items: [...(g?.items ?? []), ...page.generations.flatMap(generationItems)],
          cursor: page.nextCursor,
        }));
      } else if (tab === "uploads" && uploads?.cursor != null) {
        const page = await listUploads(workspaceId, uploads.cursor);
        if (page.error !== undefined) return setError(page.error);
        setUploads((u) => ({
          items: [...(u?.items ?? []), ...page.uploads.map(uploadItem).filter((i) => i !== null)],
          cursor: page.nextCursor,
        }));
      }
    });
  }

  async function upload(files: FileList) {
    setTab("uploads");
    await Promise.all(
      [...files].map(async (file) => {
        const key = `${file.name}-${file.size}-${Date.now()}`;
        const abort = new AbortController();
        aborts.current.add(abort);
        setUploading((list) => [...list, { key, name: file.name, progress: 0 }]);
        let uploadId: number | undefined;
        try {
          const done = await uploadFile(workspaceId, file, {
            signal: abort.signal,
            onCreated: (id) => (uploadId = id),
            onProgress: (progress) =>
              setUploading((list) => list.map((u) => (u.key === key ? { ...u, progress } : u))),
          });
          const item = uploadItem(done);
          if (item) {
            setUploads((u) => ({ items: [item, ...(u?.items ?? [])], cursor: u?.cursor ?? null }));
            onAdd(item);
          }
        } catch (err) {
          if (uploadId !== undefined) deleteUpload(workspaceId, uploadId);
          if (!abort.signal.aborted) setError(err instanceof Error ? err.message : "The upload failed.");
        } finally {
          aborts.current.delete(abort);
          setUploading((list) => list.filter((u) => u.key !== key));
        }
      }),
    );
  }

  const list = tab === "generations" ? generations : uploads;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1 border-b border-white/10 p-2">
        {(["generations", "uploads"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 capitalize transition hover:text-white aria-pressed:bg-white/10 aria-pressed:text-white"
          >
            {t}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer items-center gap-1.5 rounded-md bg-indigo-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-400"
        >
          <UploadIcon className="size-3.5" />
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {error && (
          <p className="mb-2 flex items-start justify-between gap-2 rounded-md bg-red-500/10 p-2 text-xs text-red-300">
            {error}
            <button type="button" onClick={() => setError(null)} className="cursor-pointer text-red-200 underline">
              Dismiss
            </button>
          </p>
        )}
        {adding && <p className="mb-2 text-xs text-zinc-400">Adding…</p>}
        {uploading.map((u) => (
          <div key={u.key} className="mb-2 rounded-md bg-white/5 p-2 text-xs text-zinc-300">
            <p className="truncate">Uploading {u.name}</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded bg-white/10">
              <div className="h-full bg-indigo-400 transition-[width]" style={{ width: `${Math.round(u.progress * 100)}%` }} />
            </div>
          </div>
        ))}

        {list === null ? (
          <p className="p-4 text-center text-xs text-zinc-500">Loading…</p>
        ) : list.items.length === 0 ? (
          <p className="p-4 text-center text-xs leading-relaxed text-zinc-500">
            {tab === "generations"
              ? "No finished generations in this workspace yet. Make some in the studio, or upload your own files."
              : "Upload videos, images or music (MP3, M4A, WAV) to use them here."}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {list.items.map((item) => (
              <li key={`${item.ref.type}-${item.ref.id}-${"index" in item.ref ? item.ref.index : 0}`}>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  title={`Add to the timeline: ${item.label}`}
                  className="group relative block w-full cursor-pointer overflow-hidden rounded-md bg-black text-left ring-1 ring-white/10 transition hover:ring-indigo-400"
                >
                  <div className="aspect-video">
                    {item.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element -- workspace media on R2 / Runware's CDN
                      <img src={item.url} alt="" loading="lazy" className="size-full object-cover" />
                    ) : item.kind === "video" ? (
                      <video src={`${item.url}#t=0.5`} muted playsInline preload="metadata" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-emerald-950 text-emerald-300">
                        <MusicIcon className="size-6" />
                      </div>
                    )}
                  </div>
                  <span className="block truncate px-1.5 py-1 text-[11px] text-zinc-300">{item.label}</span>
                  <span className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-indigo-500 text-white opacity-0 shadow transition group-hover:opacity-100">
                    <PlusIcon className="size-3.5" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {list?.cursor != null && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-3 w-full cursor-pointer rounded-md bg-white/5 py-2 text-xs text-zinc-300 hover:bg-white/10 disabled:cursor-wait"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
