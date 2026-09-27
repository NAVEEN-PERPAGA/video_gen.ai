"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { type Generation, type GenerationsPage, getGeneration, listGenerations } from "@/app/generate/actions";
import { AlertIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "@/app/generate/icons";
import { POLL_INTERVAL_MS, VideoComposer } from "@/app/generate/video-composer";
import { getVideoModel } from "@/lib/runware/models";

/**
 * The selected workspace's generations plus the composer that adds to them.
 * `initial` is the first page, loaded on the server; null when there is no
 * workspace. Render with `key={workspaceId}` so switching workspaces resets it.
 */
export function Studio({
  workspaceId,
  initial,
  signedIn,
}: {
  workspaceId: number | null;
  initial: GenerationsPage | null;
  signedIn: boolean;
}) {
  const firstPage = initial && initial.error === undefined ? initial : null;
  const [generations, setGenerations] = useState<Generation[]>(firstPage?.generations ?? []);
  const [nextCursor, setNextCursor] = useState(firstPage?.nextCursor ?? null);
  const [error, setError] = useState(initial?.error);
  const [loadingMore, startLoadingMore] = useTransition();
  /** The generation open in the full-window viewer. An id, so polled updates show there too. */
  const [openId, setOpenId] = useState<number | null>(null);
  const openIndex = generations.findIndex((g) => g.id === openId);

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
        <section aria-labelledby="generations-heading" className="flex flex-col gap-4">
          <h1 id="generations-heading" className="text-lg font-semibold">
            Generations
          </h1>

          {generations.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {generations.map((g) => (
                <li key={g.id}>
                  <GenerationCard generation={g} onOpen={() => setOpenId(g.id)} />
                </li>
              ))}
            </ul>
          ) : (
            !error && (
              <p className="rounded-lg border border-dashed border-black/15 p-10 text-center text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
                No videos in this workspace yet. Describe a shot below to generate the first one.
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
        />
      )}

      <VideoComposer workspaceId={workspaceId} signedIn={signedIn} onGeneration={upsert} />
    </>
  );
}

function promptOf(g: Generation) {
  return g.videoMetadata?.request?.positivePrompt;
}

function modelNameOf(g: Generation) {
  return g.model ? (getVideoModel(g.model)?.name ?? g.model) : null;
}

/** Formatted in the viewer's locale and time zone, which the server can't know. */
function CreatedAt({ generation: g }: { generation: Generation }) {
  return (
    <time dateTime={g.createdAt} suppressHydrationWarning>
      {new Date(g.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
}

/** A gallery tile. Hovering previews the (muted) video; clicking opens the viewer. */
function GenerationCard({ generation: g, onOpen }: { generation: Generation; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prompt = promptOf(g);
  const modelName = modelNameOf(g);
  const [firstUrl] = g.videoUrls;

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
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-black/10 bg-white text-left shadow-sm transition duration-200 outline-none hover:-translate-y-1 hover:border-indigo-400/60 hover:shadow-xl hover:shadow-indigo-500/10 focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:translate-y-0 dark:border-white/15 dark:bg-zinc-900 dark:hover:border-indigo-400/50"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {firstUrl ? (
          <>
            <video
              ref={videoRef}
              src={firstUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className="size-full object-contain transition duration-300 group-hover:scale-[1.03]"
            />
            {g.videoUrls.length > 1 && (
              <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                {g.videoUrls.length} videos
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
        {g.error && g.videoUrls.length > 0 && (
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
 * A generation filling the window: the video with controls, and its details.
 * A modal <dialog>, so Escape closes it and focus stays inside; the arrow keys
 * move between generations.
 */
function GenerationViewer({
  generation: g,
  position,
  onPrev,
  onNext,
  onClose,
}: {
  generation: Generation;
  position: string;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  // Back to the first video when moving to another generation.
  const [shownId, setShownId] = useState(g.id);
  if (shownId !== g.id) {
    setShownId(g.id);
    setVideoIndex(0);
  }
  const url = g.videoUrls[videoIndex] ?? g.videoUrls[0];
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
            {url ? (
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

          {g.videoUrls.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-3 pb-3">
              {g.videoUrls.map((u, i) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setVideoIndex(i)}
                  aria-label={`Video ${i + 1}`}
                  aria-current={u === url}
                  className={`h-14 shrink-0 cursor-pointer overflow-hidden rounded-md ring-2 transition ${
                    u === url ? "ring-indigo-400" : "opacity-60 ring-transparent hover:opacity-100"
                  }`}
                >
                  <video src={u} muted preload="metadata" className="h-full bg-black" />
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
          {g.error && g.videoUrls.length > 0 && <p className="text-xs text-amber-300">{g.error}</p>}
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
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-auto rounded-md bg-white/10 px-3 py-2 text-center text-xs font-medium transition hover:bg-white/20"
            >
              Open video in new tab
            </a>
          )}
        </aside>
      </div>
    </dialog>
  );
}
