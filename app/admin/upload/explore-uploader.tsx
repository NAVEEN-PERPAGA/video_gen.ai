"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EXPLORE_VIDEO_TYPES } from "@/lib/explore";
import type { UploadTarget } from "@/lib/uploads";
import { completeExploreUpload, deleteExploreVideo, importExploreVideo, startExploreUpload } from "./actions";

export const INPUT =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/20";

/** Same limits as node_scalable's explore.schema.ts. */
export const MAX = { title: 120, description: 2000, prompt: 4000, objectKey: 1024 };

type Source = "file" | "r2";

export interface ModelOption {
  value: string;
  name: string;
  organisation: string;
}

/**
 * Adds a video to /explore, from either source:
 *   - a file: startExploreUpload registers it and returns a presigned PUT
 *     URL, the file goes straight from the browser to R2 (with progress, and
 *     cancellable), then completeExploreUpload confirms it, which publishes it.
 *     If any step fails or is cancelled, the pending video is deleted again.
 *   - an object already in R2: importExploreVideo publishes it by its key.
 */
export function ExploreUploader({ models }: { models: ModelOption[] }) {
  const [source, setSource] = useState<Source>("file");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [lengths, setLengths] = useState({ title: 0, description: 0, prompt: 0 });
  const abort = useRef<AbortController | null>(null);

  const busy = saving || progress !== null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const fields = {
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      prompt: String(data.get("prompt") ?? ""),
      model: String(data.get("model") ?? ""),
    };
    setError(null);
    setDone(null);

    const published = source === "file" ? await uploadFile(fields) : await importObject(fields, data);
    if (!published) return;
    form.reset();
    setFile(null);
    setLengths({ title: 0, description: 0, prompt: 0 });
    setDone(`“${published}” is live on /explore.`);
  }

  /** Returns the published title, or null after reporting an error. */
  async function uploadFile(fields: { title: string; description: string; prompt: string; model: string }) {
    if (!file) return fail("Choose a video file.");

    const controller = new AbortController();
    abort.current = controller;
    setProgress(0);
    try {
      const started = await startExploreUpload({ ...fields, fileName: file.name, contentType: file.type, size: file.size });
      if (!started.ok) return fail(started.error);

      const { video, target } = started.value;
      try {
        await put(file, target, controller.signal, setProgress);
      } catch (err) {
        void deleteExploreVideo(video.id);
        if (err instanceof DOMException && err.name === "AbortError") return fail("Upload cancelled.");
        return fail(err instanceof Error ? err.message : "Could not send the file to storage.");
      }

      setSaving(true);
      const completed = await completeExploreUpload(video.id);
      if (!completed.ok) {
        void deleteExploreVideo(video.id);
        return fail(completed.error);
      }
      return completed.value.title;
    } finally {
      abort.current = null;
      setProgress(null);
      setSaving(false);
    }
  }

  async function importObject(fields: { title: string; description: string; prompt: string; model: string }, data: FormData) {
    setSaving(true);
    try {
      const fileName = String(data.get("fileName") ?? "").trim();
      const imported = await importExploreVideo({
        ...fields,
        objectKey: String(data.get("objectKey") ?? ""),
        ...(fileName && { fileName }),
      });
      return imported.ok ? imported.value.title : fail(imported.error);
    } finally {
      setSaving(false);
    }
  }

  function fail(message: string): null {
    setError(message);
    return null;
  }

  function pick(next: File | null) {
    setError(null);
    setDone(null);
    if (next && !EXPLORE_VIDEO_TYPES.includes(next.type)) {
      setFile(null);
      return setError(`${next.name} isn't a supported video (MP4, WebM, MOV, MKV, OGV, MPEG, AVI or 3GP).`);
    }
    setFile(next);
  }

  const count = (name: keyof typeof lengths) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setLengths((l) => ({ ...l, [name]: e.target.value.length }));

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-2xl border border-black/10 p-6 shadow-sm dark:border-white/15"
    >
      <div
        role="tablist"
        aria-label="Video source"
        className="flex gap-1 self-start rounded-lg bg-black/5 p-1 text-sm dark:bg-white/10"
      >
        {(
          [
            ["file", "Upload a file"],
            ["r2", "Already in R2"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={source === value}
            disabled={busy}
            onClick={() => {
              setSource(value);
              setError(null);
            }}
            className="cursor-pointer rounded-md px-3 py-1.5 font-medium text-zinc-600 transition hover:text-foreground aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-sm disabled:cursor-default dark:text-zinc-400"
          >
            {label}
          </button>
        ))}
      </div>

      {source === "file" ? (
        <Dropzone file={file} disabled={busy} onPick={pick} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="Object key" hint="Path inside the uploads bucket, without a leading slash.">
            <input
              name="objectKey"
              required
              maxLength={MAX.objectKey}
              placeholder="explore/videos/neon-city.mp4"
              className={`${INPUT} font-mono`}
            />
          </Field>
          <Field label="File name" optional hint="Defaults to the key's last part.">
            <input name="fileName" maxLength={255} className={INPUT} />
          </Field>
        </div>
      )}

      <Field label="Title" count={[lengths.title, MAX.title]}>
        <input name="title" required maxLength={MAX.title} onChange={count("title")} className={INPUT} />
      </Field>
      <Field label="Description" optional count={[lengths.description, MAX.description]} hint="Shown under the title on /explore.">
        <textarea
          name="description"
          rows={3}
          maxLength={MAX.description}
          onChange={count("description")}
          className={INPUT}
        />
      </Field>

      <div className="grid gap-4">
        <Field label="Model" optional hint='Shown as "Made with …" and used by the model filter.'>
          <ModelSelect models={models} />
        </Field>
        <Field label="Prompt" optional count={[lengths.prompt, MAX.prompt]} hint="The prompt that made the video.">
          <textarea name="prompt" rows={4} maxLength={MAX.prompt} onChange={count("prompt")} className={INPUT} />
        </Field>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          {done}
        </p>
      )}

      {progress !== null && !saving && (
        <div className="flex flex-col gap-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">
            {Math.round(progress * 100)}% of {file ? formatBytes(file.size) : "the file"}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="group inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 disabled:translate-y-0 disabled:cursor-default disabled:opacity-70 disabled:shadow-none"
        >
          {busy ? <Spinner /> : <UploadIcon />}
          {saving
            ? "Publishing…"
            : progress !== null
              ? `Uploading ${Math.round(progress * 100)}%`
              : source === "file"
                ? "Upload video"
                : "Add video"}
        </button>
        {progress !== null && !saving && (
          <button
            type="button"
            onClick={() => abort.current?.abort()}
            className="h-11 cursor-pointer rounded-xl px-4 text-sm font-medium text-zinc-600 transition hover:text-foreground dark:text-zinc-400"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/** A labelled field with an optional hint and a character counter. */
export function Field({
  label,
  optional,
  hint,
  count,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  count?: [number, number];
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-medium">
          {label}
          {optional && <span className="font-normal text-zinc-500"> (optional)</span>}
        </span>
        {count && count[0] > 0 && (
          <span className={`text-xs ${count[0] >= count[1] ? "text-red-600" : "text-zinc-500"}`}>
            {count[0]}/{count[1]}
          </span>
        )}
      </span>
      {children}
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

/** Click or drop a video; shows a preview of the chosen one. */
function Dropzone({ file, disabled, onPick }: { file: File | null; disabled: boolean; onPick: (f: File | null) => void }) {
  const [over, setOver] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  if (file && preview) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-black/10 p-3 sm:flex-row sm:items-center dark:border-white/15">
        <video src={preview} muted controls playsInline className="aspect-video w-full rounded-lg bg-black object-contain sm:w-56" />
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <p className="truncate font-medium">{file.name}</p>
          <p className="text-zinc-500">
            {formatBytes(file.size)} · {file.type.replace("video/", "").toUpperCase()}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(null)}
            className="mt-1 cursor-pointer self-start text-sm font-medium text-indigo-600 hover:underline disabled:cursor-default disabled:opacity-60 dark:text-indigo-400"
          >
            Choose another video
          </button>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) onPick(e.dataTransfer.files[0] ?? null);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
        over
          ? "border-indigo-500 bg-indigo-500/5"
          : "border-black/15 hover:border-indigo-400 hover:bg-indigo-500/5 dark:border-white/20"
      }`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
        <UploadIcon className="size-6" />
      </span>
      <span className="text-sm">
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to choose a video</span> or drag it
        here
      </span>
      <span className="text-xs text-zinc-500">MP4, WebM, MOV, MKV, OGV, MPEG, AVI or 3GP</span>
      <input
        type="file"
        accept={EXPLORE_VIDEO_TYPES.join(",")}
        disabled={disabled}
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          // The file lives in state; clearing lets the same file be picked again after an error.
          e.target.value = "";
        }}
        className="sr-only"
      />
    </label>
  );
}

/** The model picker, grouped by organisation. Keeps an unknown saved value selectable. */
export function ModelSelect({ models, defaultValue = "" }: { models: ModelOption[]; defaultValue?: string }) {
  const known = !defaultValue || models.some((m) => m.value === defaultValue);
  return (
    <select name="model" defaultValue={defaultValue} className={INPUT}>
      <option value="">None</option>
      {!known && <option value={defaultValue}>{defaultValue}</option>}
      {groupByOrganisation(models).map(([org, list]) => (
        <optgroup key={org} label={org}>
          {list.map((m) => (
            <option key={m.value} value={m.value}>
              {m.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4 animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

function groupByOrganisation(models: ModelOption[]): [string, ModelOption[]][] {
  const groups = new Map<string, ModelOption[]>();
  for (const m of models) groups.set(m.organisation, [...(groups.get(m.organisation) ?? []), m]);
  return [...groups];
}

function formatBytes(bytes: number) {
  return bytes >= 1_000_000_000 ? `${(bytes / 1_000_000_000).toFixed(2)} GB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
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
    xhr.onerror = () =>
      reject(new Error("Could not send the file to storage. Check your connection, or the bucket's CORS settings."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}
