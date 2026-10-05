"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  deleteGeneration,
  type Generation,
  type GenerationsPage,
  getGeneration,
  listGenerations,
} from "@/app/generate/actions";
import { AlertIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, XIcon } from "@/app/generate/icons";
import { type ComposerPreset, POLL_INTERVAL_MS, VideoComposer } from "@/app/generate/video-composer";
import { getModel } from "@/lib/runware/models";

/**
 * The selected workspace's generations plus the composer that adds to them.
 * `initial` is the first page, loaded on the server; null when there is no
 * workspace. Render with `key={workspaceId}` so switching workspaces resets it.
 */
export function Studio({
  workspaceId,
  initial,
  signedIn,
  preset,
}: {
  workspaceId: number | null;
  initial: GenerationsPage | null;
  signedIn: boolean;
  /** The composer's starting model and settings on a tool page. */
  preset?: ComposerPreset;
}) {
  const firstPage = initial && initial.error === undefined ? initial : null;
  const [generations, setGenerations] = useState<Generation[]>(firstPage?.generations ?? []);
  const [nextCursor, setNextCursor] = useState(firstPage?.nextCursor ?? null);
  const [error, setError] = useState(initial?.error);
  const [loadingMore, startLoadingMore] = useTransition();
  /** The generation open in the full-window viewer. An id, so polled updates show there too. */
  const [openId, setOpenId] = useState<number | null>(null);
  const openIndex = generations.findIndex((g) => g.id === openId);
  /** Generations with a delete request in flight. */
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  /** Adds a new generation at the top, or updates one already listed. */
  const upsert = useCallback((generation: Generation) => {
    setGenerations((list) => {
      const index = list.findIndex((g) => g.id === generation.id);
      if (index === -1) return [generation, ...list];
      // A late poll answer must not turn a finished generation back into a processing one.
      if (generation.status === "processing" && list[index].status !== "processing") return list;
      return list.map((g, i) => (i === index ? generation : g));
    });
  }, []);

  // The list endpoint reports stored statuses; polling each processing
  // generation is what asks the API to check Runware and record the result.
  const processingIds = generations
    .filter((g) => g.status === "processing")
    .map((g) => g.id)
    .join(",");
  useEffect(() => {
    if (!processingIds || workspaceId === null) return;
    let busy = false;
    const timer = setInterval(async () => {
      if (busy) return;
      busy = true;
      const results = await Promise.all(processingIds.split(",").map((id) => getGeneration(workspaceId, Number(id))));
      busy = false;
      for (const result of results) if (result?.generation) upsert(result.generation);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [processingIds, workspaceId, upsert]);

  async function remove(generation: Generation) {
    if (workspaceId === null) return;
    if (!window.confirm("Delete this generation? This can't be undone.")) return;
    setDeletingIds((ids) => [...ids, generation.id]);
    const result = await deleteGeneration(workspaceId, generation.id);
    setDeletingIds((ids) => ids.filter((id) => id !== generation.id));
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    // If it was open in the viewer, show the next one along (or close the viewer).
    setOpenId((current) => {
      if (current !== generation.id) return current;
      const index = generations.findIndex((g) => g.id === generation.id);
      return (generations[index + 1] ?? generations[index - 1])?.id ?? null;
    });
    setGenerations((list) => list.filter((g) => g.id !== generation.id));
  }

  function loadMore() {
    if (workspaceId === null || nextCursor === null) return;
    startLoadingMore(async () => {
      const page = await listGenerations(workspaceId, nextCursor);
      if (page.error !== undefined) {
        setError(page.error);
        return;
      }
      setError(undefined);
      setGenerations((list) => [...list, ...page.generations.filter((g) => !list.some((l) => l.id === g.id))]);
      setNextCursor(page.nextCursor);
    });
  }

  return (
    <>
      {workspaceId !== null && (
        // At least the viewport below the header (h-14) and main's pt-12, so the page's article starts below the fold.
        <section aria-labelledby="generations-heading" className="flex min-h-[calc(100dvh-6.5rem)] flex-col gap-4">
          {/* h2: every page that shows the studio has its own h1. Screen-reader only. */}
          <h2 id="generations-heading" className="sr-only">
            Generations
          </h2>

          {generations.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {generations.map((g) => (
                <li key={g.id} className="group/card relative">
                  <GenerationCard generation={g} onOpen={() => setOpenId(g.id)} />
                  {/* A sibling of the card, since a button can't sit inside another button. */}
                  <button
                    type="button"
                    onClick={() => remove(g)}
                    disabled={deletingIds.includes(g.id)}
                    aria-label="Delete generation"
                    title="Delete"
                    className="absolute top-2 left-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition duration-200 outline-none group-hover/card:-translate-y-1 group-hover/card:opacity-100 hover:bg-red-600 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-wait disabled:opacity-100"
                  >
                    {deletingIds.includes(g.id) ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <TrashIcon className="size-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !error && (
              <p className="rounded-lg border border-dashed border-black/15 p-10 text-center text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
                Nothing in this workspace yet. Describe a shot or an image below to generate the first one.
              </p>
            )
          )}

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
              {error}
            </p>
          )}

          {nextCursor !== null && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="self-center rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:border-black/25 disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:bg-zinc-900 dark:hover:border-white/30"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </section>
      )}

      {openIndex !== -1 && (
        <GenerationViewer
          generation={generations[openIndex]}
          position={`${openIndex + 1} / ${generations.length}`}
          onPrev={openIndex > 0 ? () => setOpenId(generations[openIndex - 1].id) : undefined}
          onNext={openIndex < generations.length - 1 ? () => setOpenId(generations[openIndex + 1].id) : undefined}
          onClose={() => setOpenId(null)}
          onDelete={() => remove(generations[openIndex])}
          deleting={deletingIds.includes(generations[openIndex].id)}
        />
      )}

      <VideoComposer workspaceId={workspaceId} signedIn={signedIn} onGeneration={upsert} preset={preset} />
    </>
  );
}

function promptOf(g: Generation) {
  return g.videoMetadata?.request?.positivePrompt;
}

/** The generated files: videos or images, depending on the generation. */
function outputsOf(g: Generation) {
  return g.mediaType === "image" ? g.imageUrls : g.videoUrls;
}

function modelNameOf(g: Generation) {
  return g.model ? (getModel(g.model)?.name ?? g.model) : null;
}

/** Formatted in the viewer's locale and time zone, which the server can't know. */
function CreatedAt({ generation: g }: { generation: Generation }) {
  return (
    <time dateTime={g.createdAt} suppressHydrationWarning>
      {new Date(g.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
}

/** A gallery tile. Hovering previews a (muted) video; clicking opens the viewer. */
function GenerationCard({ generation: g, onOpen }: { generation: Generation; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prompt = promptOf(g);
  const modelName = modelNameOf(g);
  const outputs = outputsOf(g);
  const [firstUrl] = outputs;
  const isImage = g.mediaType === "image";

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        const video = videoRef.current;
        if (!video) return;
        video.pause();
        video.currentTime = 0;
      }}
      aria-label={prompt ? `Open "${prompt}"` : "Open generation"}
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white text-left shadow-sm transition duration-200 outline-none hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:translate-y-0 dark:bg-zinc-900"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {firstUrl ? (
          <>
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated image on Runware's CDN
              <img
                src={firstUrl}
                alt=""
                loading="lazy"
                className="size-full object-contain transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <video
                ref={videoRef}
                src={firstUrl}
                muted
                loop
                playsInline
                preload="metadata"
                className="size-full object-contain transition duration-300 group-hover:scale-[1.03]"
              />
            )}
            {outputs.length > 1 && (
              <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                {outputs.length} {isImage ? "images" : "videos"}
              </span>
            )}
          </>
        ) : g.status === "processing" ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <span className="size-5 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-500" />
            Generating…
          </div>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-red-50 p-4 text-center text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertIcon className="size-5" />
            <span className="line-clamp-3">{g.error ?? "Generation failed"}</span>
          </div>
        )}
      </div>

      <div className="flex w-full flex-1 flex-col gap-1.5 p-3 text-sm">
        {prompt && <p className="line-clamp-2 text-zinc-800 dark:text-zinc-200">{prompt}</p>}
        {/* A partial failure: some of several results succeeded. */}
        {g.error && outputs.length > 0 && (
          <p className="line-clamp-2 text-xs text-amber-700 dark:text-amber-300">{g.error}</p>
        )}
        <p className="mt-auto flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {modelName && <span className="truncate font-medium">{modelName}</span>}
          {modelName && <span aria-hidden="true">·</span>}
          <CreatedAt generation={g} />
          {g.cost !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span>${g.cost.toFixed(4)}</span>
            </>
          )}
        </p>
      </div>
    </button>
  );
}

const viewerButton =
  "flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white outline-none transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50";

/**
 * A generation filling the window: the video with controls (or the image), and its details.
 * A modal <dialog>, so Escape closes it and focus stays inside; the arrow keys
 * move between generations.
 */
function GenerationViewer({
  generation: g,
  position,
  onPrev,
  onNext,
  onClose,
  onDelete,
  deleting,
}: {
  generation: Generation;
  position: string;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  // Back to the first video when moving to another generation.
  const [shownId, setShownId] = useState(g.id);
  if (shownId !== g.id) {
    setShownId(g.id);
    setVideoIndex(0);
  }
  const outputs = outputsOf(g);
  const isImage = g.mediaType === "image";
  const noun = isImage ? "image" : "video";
  const url = outputs[videoIndex] ?? outputs[0];
  const prompt = promptOf(g);
  const modelName = modelNameOf(g);

  useEffect(() => {
    dialogRef.current?.showModal();
    // The page behind shouldn't scroll while the viewer is open.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // A focused video uses the arrow keys to seek.
      if (e.target instanceof HTMLVideoElement) return;
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onPrev, onNext]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={prompt ?? "Generation"}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none bg-zinc-950 p-0 text-zinc-100 backdrop:bg-black/80"
    >
      <div className="flex size-full flex-col lg:flex-row">
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 p-3">
            <span className="text-sm text-zinc-400 tabular-nums">{position}</span>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close" className={viewerButton}>
              <XIcon className="size-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3 sm:px-16">
            {url && isImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated image on Runware's CDN
              <img key={url} src={url} alt={prompt ?? ""} className="max-h-full max-w-full rounded-lg bg-black object-contain" />
            ) : url ? (
              <video
                key={url}
                src={url}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-full max-w-full rounded-lg bg-black"
              />
            ) : g.status === "processing" ? (
              <div className="flex flex-col items-center gap-3 text-sm text-zinc-400">
                <span className="size-8 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
                Generating…
              </div>
            ) : (
              <div className="flex max-w-md flex-col items-center gap-3 text-center text-sm text-red-300">
                <AlertIcon className="size-8" />
                {g.error ?? "Generation failed"}
              </div>
            )}

            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                aria-label="Previous generation"
                className={`${viewerButton} absolute top-1/2 left-3 -translate-y-1/2`}
              >
                <ChevronLeftIcon className="size-5" />
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                aria-label="Next generation"
                className={`${viewerButton} absolute top-1/2 right-3 -translate-y-1/2`}
              >
                <ChevronRightIcon className="size-5" />
              </button>
            )}
          </div>

          {outputs.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-3 pb-3">
              {outputs.map((u, i) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setVideoIndex(i)}
                  aria-label={`${isImage ? "Image" : "Video"} ${i + 1}`}
                  aria-current={u === url}
                  className={`h-14 shrink-0 cursor-pointer overflow-hidden rounded-md ring-2 transition ${
                    u === url ? "ring-indigo-400" : "opacity-60 ring-transparent hover:opacity-100"
                  }`}
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- generated image on Runware's CDN
                    <img src={u} alt="" className="h-full bg-black" />
                  ) : (
                    <video src={u} muted preload="metadata" className="h-full bg-black" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="flex max-h-[40%] shrink-0 flex-col gap-4 overflow-y-auto border-t border-white/10 p-5 text-sm lg:max-h-none lg:w-80 lg:border-t-0 lg:border-l">
          {prompt && (
            <div>
              <h2 className="mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">Prompt</h2>
              <p className="leading-relaxed whitespace-pre-wrap text-zinc-100">{prompt}</p>
            </div>
          )}
          {g.error && outputs.length > 0 && <p className="text-xs text-amber-300">{g.error}</p>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
            {modelName && (
              <>
                <dt className="text-zinc-500">Model</dt>
                <dd>{modelName}</dd>
              </>
            )}
            <dt className="text-zinc-500">Status</dt>
            <dd className="capitalize">{g.status}</dd>
            <dt className="text-zinc-500">Created</dt>
            <dd>
              <CreatedAt generation={g} />
            </dd>
            {g.cost !== null && (
              <>
                <dt className="text-zinc-500">Cost</dt>
                <dd>${g.cost.toFixed(4)}</dd>
              </>
            )}
          </dl>
          <div className="mt-auto flex flex-col gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-white/10 px-3 py-2 text-center text-xs font-medium transition hover:bg-white/20"
              >
                Open {noun} in new tab
              </a>
            )}
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/25 disabled:cursor-wait disabled:opacity-60"
            >
              <TrashIcon className="size-3.5" />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </aside>
      </div>
    </dialog>
  );
}
