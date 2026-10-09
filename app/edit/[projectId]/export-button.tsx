"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getRender, type Render, startRender } from "@/app/edit/actions";
import { DownloadIcon, XIcon } from "@/app/generate/icons";
import { useDismiss } from "@/lib/use-dismiss";

/** How often a running export is checked. */
const POLL_MS = 2000;

type State =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "running"; render: Render }
  | { phase: "done"; render: Render; video?: string }
  | { phase: "failed"; message: string };

/**
 * Exports the project to MP4: saves it (`flush`), queues a render on the
 * server and follows its progress. The finished video is also a generation,
 * so it shows up in the studio's gallery.
 */
export function ExportButton({
  workspaceId,
  projectId,
  disabled,
  flush,
}: {
  workspaceId: number;
  projectId: number;
  disabled: boolean;
  /** Saves pending changes; false if that failed. */
  flush: () => Promise<boolean>;
}) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useDismiss(rootRef, open, useCallback(() => setOpen(false), []));

  const renderId = state.phase === "running" ? state.render.id : null;
  useEffect(() => {
    if (renderId === null) return;
    let busy = false;
    const timer = setInterval(async () => {
      if (busy) return;
      busy = true;
      const result = await getRender(workspaceId, renderId);
      busy = false;
      if (result.error !== undefined) return; // Try again on the next tick.
      const { render } = result;
      if (render.status === "completed") {
        setState({ phase: "done", render, video: result.video });
        setOpen(true);
      } else if (render.status === "failed") {
        setState({ phase: "failed", message: render.error ?? "The export failed." });
        setOpen(true);
      } else {
        setState({ phase: "running", render });
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [workspaceId, renderId]);

  async function start() {
    setOpen(true);
    setState({ phase: "starting" });
    if (!(await flush())) {
      setState({ phase: "failed", message: "The project couldn't be saved, so it wasn't exported. Try again." });
      return;
    }
    const result = await startRender(workspaceId, projectId);
    setState(result.error !== undefined ? { phase: "failed", message: result.error } : { phase: "running", render: result.render });
  }

  const busy = state.phase === "starting" || state.phase === "running";
  const progress = state.phase === "running" ? state.render.progress : 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={busy || state.phase === "done" || state.phase === "failed" ? () => setOpen((o) => !o) : start}
        disabled={disabled && !busy && state.phase === "idle"}
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-indigo-500 px-3 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <DownloadIcon className="size-4" />
        {state.phase === "starting"
          ? "Starting…"
          : state.phase === "running"
            ? state.render.status === "queued"
              ? "Queued…"
              : `Exporting ${Math.round(progress * 100)}%`
            : "Export"}
      </button>

      {open && state.phase !== "idle" && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-white/10 bg-zinc-900 p-4 text-sm shadow-xl">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-2 right-2 flex size-6 cursor-pointer items-center justify-center rounded text-zinc-400 hover:bg-white/10"
          >
            <XIcon className="size-4" />
          </button>
          {busy && (
            <>
              <p className="font-medium">
                {state.phase === "running" && state.render.status === "rendering" ? "Rendering your video" : "Waiting to start"}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded bg-white/10">
                <div className="h-full bg-indigo-400 transition-[width] duration-500" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                You can keep editing, or leave: the finished video will be in the studio. Changes made now aren&apos;t in
                this export.
              </p>
            </>
          )}
          {state.phase === "done" && (
            <>
              <p className="font-medium">Your video is ready</p>
              <div className="mt-3 flex flex-col gap-2">
                {state.video && (
                  <a
                    href={state.video}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-indigo-500 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-indigo-400"
                  >
                    Open the video
                  </a>
                )}
                <Link
                  href={{ pathname: "/generate", query: { workspace: workspaceId } }}
                  className="rounded-md bg-white/10 px-3 py-2 text-center text-xs font-medium hover:bg-white/15"
                >
                  See it in the studio
                </Link>
                <button
                  type="button"
                  onClick={start}
                  className="cursor-pointer rounded-md px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  Export again
                </button>
              </div>
            </>
          )}
          {state.phase === "failed" && (
            <>
              <p className="font-medium text-red-300">Export failed</p>
              <p className="mt-2 text-xs text-zinc-300">{state.message}</p>
              <button
                type="button"
                onClick={start}
                disabled={disabled}
                className="mt-3 w-full cursor-pointer rounded-md bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15 disabled:opacity-40"
              >
                Try again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
