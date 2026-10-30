"use client";

import { useState, useTransition } from "react";
import { deleteExploreVideo } from "./actions";

/** Removes one video from /explore, after a confirmation. */
export function DeleteVideoButton({ videoId, title }: { videoId: number; title: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete “${title}” from Explore? This also deletes the file.`)) return;
          startTransition(async () => {
            const result = await deleteExploreVideo(videoId);
            setError(result.ok ? null : result.error);
          });
        }}
        className="cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-600/40 disabled:cursor-default disabled:opacity-60 dark:border-white/15"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
