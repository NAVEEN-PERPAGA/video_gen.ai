"use client";

import { useState, useTransition } from "react";
import type { ExploreVideo } from "@/lib/explore";
import { updateExploreVideo } from "./actions";
import { DeleteVideoButton } from "./delete-video-button";
import { Field, INPUT, MAX, ModelSelect, type ModelOption, Spinner } from "./explore-uploader";

/**
 * One video in the admin list. "Edit" swaps the summary for a form of its
 * details (title, description, model, prompt, file name); the file itself
 * can't be changed, so replacing it means delete and upload again.
 */
export function VideoRow({ video, models }: { video: ExploreVideo; models: ModelOption[] }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "");
    startTransition(async () => {
      const result = await updateExploreVideo(video.id, {
        title: text("title"),
        description: text("description"),
        prompt: text("prompt"),
        model: text("model"),
        fileName: text("fileName"),
      });
      if (!result.ok) return setError(result.error);
      setError(null);
      setEditing(false);
    });
  }

  return (
    <li className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        {video.url ? (
          <video
            src={`${video.url}#t=0.1`}
            preload="metadata"
            muted
            className="h-16 w-28 shrink-0 rounded bg-black object-contain"
          />
        ) : (
          <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded bg-black/5 text-xs text-zinc-500 dark:bg-white/10">
            Pending
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
          <p className="truncate font-medium">{video.title}</p>
          {video.description && <p className="truncate text-zinc-600 dark:text-zinc-400">{video.description}</p>}
          <p className="truncate text-zinc-500">
            {video.fileName} · {(video.sizeBytes / 1_000_000).toFixed(1)} MB
            {video.status === "pending" && " · upload never finished"}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium transition hover:border-indigo-500/50 hover:text-indigo-600 dark:border-white/15 dark:hover:text-indigo-400"
            >
              Edit
            </button>
          )}
          <DeleteVideoButton videoId={video.id} title={video.title} />
        </div>
      </div>

      {editing && (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/15 dark:bg-white/[0.03]"
        >
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Title">
              <input name="title" required maxLength={MAX.title} defaultValue={video.title} className={INPUT} />
            </Field>
            <Field label="File name">
              <input name="fileName" required maxLength={255} defaultValue={video.fileName} className={INPUT} />
            </Field>
          </div>
          <Field label="Description" optional>
            <textarea
              name="description"
              rows={3}
              maxLength={MAX.description}
              defaultValue={video.description ?? ""}
              className={INPUT}
            />
          </Field>
          <Field label="Model" optional>
            <ModelSelect models={models} defaultValue={video.model ?? ""} />
          </Field>
          <Field label="Prompt" optional>
            <textarea name="prompt" rows={4} maxLength={MAX.prompt} defaultValue={video.prompt ?? ""} className={INPUT} />
          </Field>

          {error && (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:translate-y-0 disabled:cursor-default disabled:opacity-70"
            >
              {pending && <Spinner />}
              {pending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="h-10 cursor-pointer rounded-xl px-4 text-sm font-medium text-zinc-600 transition hover:text-foreground disabled:cursor-default dark:text-zinc-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
