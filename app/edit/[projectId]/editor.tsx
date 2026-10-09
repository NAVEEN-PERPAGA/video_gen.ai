"use client";

import { Player, type PlayerRef } from "@remotion/player";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Project, resolveSources, saveProject } from "@/app/edit/actions";
import { ChevronLeftIcon, RedoIcon, UndoIcon } from "@/app/generate/icons";
import { EditorComposition } from "@/lib/editor/composition";
import {
  addItem,
  audioClip,
  findItem,
  imageClip,
  removeItem,
  roomLeft,
  type Selection,
  splitAt,
  textClip,
  videoClip,
  withinLimits,
} from "@/lib/editor/edit";
import { probeMedia } from "@/lib/editor/media";
import {
  ASPECTS,
  type Aspect,
  durationInFrames,
  FPS,
  LIMITS,
  type MediaRef,
  mediaKey,
  type Timeline,
  timelineDuration,
} from "@/lib/editor/timeline";
import { ExportButton } from "./export-button";
import { Inspector } from "./inspector";
import { type LibraryItem, MediaPanel } from "./media-panel";
import { TimelinePanel } from "./timeline-panel";

/** Quiet time after an edit before it's saved. */
const SAVE_DELAY_MS = 1200;
/** Wait before retrying a save that failed (e.g. offline). */
const RETRY_DELAY_MS = 5000;
const MAX_UNDO = 100;
/** Media links may be presigned for an hour: refresh them well before they expire. */
const REFRESH_SOURCES_MS = 40 * 60_000;
const LIMIT_MESSAGE = `The video can be at most ${LIMITS.durationSeconds / 60} minutes long, with up to ${LIMITS.clips} clips, ${LIMITS.texts} texts and ${LIMITS.audio} audio tracks.`;

interface History {
  past: Timeline[];
  present: Timeline;
  future: Timeline[];
}

/** What the server last confirmed: edits are compared against it to know what's unsaved. */
interface Saved {
  version: number;
  timeline: Timeline;
  name: string;
}

function mediaOf(timeline: Timeline): MediaRef[] {
  return [...timeline.clips.map((c) => c.media), ...timeline.audio.map((a) => a.media)];
}

/**
 * The video editor: media library, preview (Remotion Player), inspector and
 * timeline. Every change is an immutable Timeline, so undo is a stack of
 * them; changes are saved automatically a moment after the last one.
 */
export function Editor({ project, initialSources }: { project: Project; initialSources: Record<string, string> }) {
  const workspaceId = project.workspaceId;
  const [history, setHistory] = useState<History>({ past: [], present: project.timeline, future: [] });
  const timeline = history.present;
  const [name, setName] = useState(project.name);
  const [sources, setSources] = useState(initialSources);
  const [selection, setSelection] = useState<Selection>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  /** Media being measured before it's added. */
  const [adding, setAdding] = useState(0);
  /** Small screens show one side panel at a time, over the preview. */
  const [panel, setPanel] = useState<"media" | "edit" | null>(null);

  const playerRef = useRef<PlayerRef>(null);
  /** The timeline when a drag or a typing session began: the whole gesture is one undo step. */
  const gestureOrigin = useRef<Timeline | null>(null);
  /** The latest timeline, for callbacks that run after an await. */
  const timelineRef = useRef(timeline);
  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  const selected = findItem(timeline, selection) ? selection : null;
  const totalFrames = durationInFrames(timeline);
  const time = Math.min(frame, totalFrames - 1) / FPS;
  const { width, height } = ASPECTS[timeline.aspect];

  // --- Editing -------------------------------------------------------------------------

  /**
   * Applies `fn` to the latest timeline. `record`: as its own undo step;
   * false during a gesture (drag, typing), which gestureEnd records as one.
   * Edits that return null or break the limits are ignored.
   */
  const edit = useCallback((fn: (t: Timeline) => Timeline | null, record = true) => {
    setHistory((h) => {
      const next = fn(h.present);
      if (!next || next === h.present || !withinLimits(next)) return h;
      if (!record) return { ...h, present: next };
      return { past: [...h.past, h.present].slice(-MAX_UNDO), present: next, future: [] };
    });
  }, []);

  /** Like edit, but explains when the edit can't be made. Returns whether it was. */
  function tryEdit(fn: (t: Timeline) => Timeline | null, whyNot?: string): boolean {
    const next = fn(timelineRef.current);
    if (!next) {
      if (whyNot) setNotice(whyNot);
      return false;
    }
    if (!withinLimits(next)) {
      setNotice(LIMIT_MESSAGE);
      return false;
    }
    edit(fn);
    return true;
  }

  function gestureStart() {
    gestureOrigin.current ??= timelineRef.current;
  }

  function gestureEnd() {
    const origin = gestureOrigin.current;
    gestureOrigin.current = null;
    if (!origin) return;
    setHistory((h) =>
      h.present === origin ? h : { past: [...h.past, origin].slice(-MAX_UNDO), present: h.present, future: [] },
    );
  }

  function undo() {
    gestureEnd();
    setHistory((h) => {
      const previous = h.past.at(-1);
      return previous ? { past: h.past.slice(0, -1), present: previous, future: [h.present, ...h.future] } : h;
    });
  }

  function redo() {
    gestureEnd();
    setHistory((h) => {
      const [next, ...future] = h.future;
      return next ? { past: [...h.past, h.present], present: next, future } : h;
    });
  }

  function split() {
    tryEdit((t) => splitAt(t, selected, time), "Move the playhead inside a clip to split it there.");
  }

  function removeSelected() {
    if (!selected) return;
    edit((t) => removeItem(t, selected));
    setSelection(null);
  }

  function addText() {
    const clip = textClip(time);
    if (tryEdit((t) => addItem(t, "texts", clip))) {
      setSelection({ track: "texts", id: clip.id });
      setPanel((p) => (p === null ? null : "edit"));
    }
  }

  async function addMedia(item: LibraryItem) {
    setSources((s) => ({ ...s, [mediaKey(item.ref)]: item.url }));
    setAdding((n) => n + 1);
    try {
      if (item.kind === "image") {
        const room = roomLeft(timelineRef.current);
        const clip = imageClip(item.ref, room);
        if (room < LIMITS.minClipSeconds) setNotice(LIMIT_MESSAGE);
        else if (tryEdit((t) => addItem(t, "clips", clip))) setSelection({ track: "clips", id: clip.id });
        return;
      }
      const { duration } = await probeMedia(item.url, item.kind);
      if (item.kind === "audio") {
        const clip = audioClip(item.ref, duration, time);
        if (tryEdit((t) => addItem(t, "audio", clip))) setSelection({ track: "audio", id: clip.id });
        return;
      }
      const room = roomLeft(timelineRef.current);
      const clip = videoClip(item.ref, duration, room);
      if (room < LIMITS.minClipSeconds) setNotice(LIMIT_MESSAGE);
      else if (tryEdit((t) => addItem(t, "clips", clip))) setSelection({ track: "clips", id: clip.id });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Couldn't add that file.");
    } finally {
      setAdding((n) => n - 1);
    }
  }

  // --- Playback ------------------------------------------------------------------------

  const seek = useCallback(
    (seconds: number) => {
      const target = Math.min(Math.max(Math.round(seconds * FPS), 0), totalFrames - 1);
      playerRef.current?.seekTo(target);
      setFrame(target);
    },
    [totalFrames],
  );

  function togglePlay() {
    playerRef.current?.toggle();
  }

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onPause);
    };
  }, []);

  const inputProps = useMemo(() => ({ timeline, sources }), [timeline, sources]);

  // --- Saving --------------------------------------------------------------------------

  const [saved, setSaved] = useState<Saved>({ version: project.version, timeline: project.timeline, name: project.name });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{ message: string; conflict: boolean } | null>(null);
  const savingRef = useRef(false);
  const cleanName = name.trim() || "Untitled project";
  const dirty = timeline !== saved.timeline || cleanName !== saved.name;

  /** Saves what changed since `base`. Returns whether it worked (false if a save is already running). */
  const save = useCallback(
    async (t: Timeline, n: string, base: Saved): Promise<boolean> => {
      if (savingRef.current) return false;
      savingRef.current = true;
      setSaving(true);
      const result = await saveProject(workspaceId, project.id, base.version, {
        ...(t !== base.timeline && { timeline: t }),
        ...(n !== base.name && { name: n }),
      });
      savingRef.current = false;
      setSaving(false);
      if (result.error !== undefined) {
        setSaveError({ message: result.error, conflict: Boolean(result.conflict) });
        return false;
      }
      setSaveError(null);
      setSaved({ version: result.project.version, timeline: t, name: n });
      return true;
    },
    [workspaceId, project.id],
  );

  // Autosave a moment after the last change. A conflict stops it: saving
  // would overwrite another tab's work, so the user reloads instead.
  useEffect(() => {
    if (!dirty || saving || saveError?.conflict) return;
    const timer = setTimeout(() => void save(timeline, cleanName, saved), saveError ? RETRY_DELAY_MS : SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dirty, saving, saveError, save, timeline, cleanName, saved]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty && !saving) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, saving]);

  /** For export: saves now if needed, so the server renders what's on screen. */
  const flush = () => (dirty ? save(timeline, cleanName, saved) : Promise.resolve(!saving));

  // Media links can be presigned for an hour; long sessions need fresh ones.
  useEffect(() => {
    const timer = setInterval(() => {
      resolveSources(workspaceId, mediaOf(timelineRef.current))
        .then((fresh) => setSources((s) => ({ ...s, ...fresh })))
        .catch(() => {});
    }, REFRESH_SOURCES_MS);
    return () => clearInterval(timer);
  }, [workspaceId]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  // --- Keyboard ------------------------------------------------------------------------

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        redo();
      } else if (mod || e.altKey) {
        return;
      } else if (key === " ") {
        // A focused button already handles Space itself.
        if (target.closest("button")) return;
        e.preventDefault();
        togglePlay();
      } else if (key === "s") {
        split();
      } else if (key === "delete" || key === "backspace") {
        if (!selected) return;
        e.preventDefault();
        removeSelected();
      } else if (key === "arrowleft" || key === "arrowright") {
        e.preventDefault();
        const step = (e.shiftKey ? 1 : 1 / FPS) * (key === "arrowleft" ? -1 : 1);
        seek(time + step);
      } else if (key === "escape") {
        setSelection(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // --- Layout --------------------------------------------------------------------------

  const status = saveError?.conflict
    ? null
    : saveError
      ? { text: "Not saved, retrying…", tone: "text-amber-300" }
      : saving
        ? { text: "Saving…", tone: "text-zinc-400" }
        : dirty
          ? { text: "Unsaved changes", tone: "text-zinc-400" }
          : { text: "Saved", tone: "text-zinc-500" };

  const sidePanel = "absolute inset-y-0 z-20 w-80 max-w-[85vw] flex-col bg-zinc-950 lg:static lg:z-auto lg:flex";

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100 [color-scheme:dark]">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 px-2 sm:px-3">
        <Link
          href={{ pathname: "/edit", query: { workspace: workspaceId } }}
          aria-label="All projects"
          title="All projects"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeftIcon className="size-5" />
        </Link>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          aria-label="Project name"
          className="w-40 min-w-0 rounded-md bg-transparent px-2 py-1 text-sm font-medium outline-none transition hover:bg-white/5 focus:bg-white/10 sm:w-64"
        />
        {status && (
          <span role="status" className={`hidden text-xs sm:inline ${status.tone}`}>
            {status.text}
          </span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={undo}
          disabled={history.past.length === 0}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
          className="flex size-8 cursor-pointer items-center justify-center rounded-md text-zinc-300 transition hover:bg-white/10 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <UndoIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={history.future.length === 0}
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
          className="flex size-8 cursor-pointer items-center justify-center rounded-md text-zinc-300 transition hover:bg-white/10 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <RedoIcon className="size-4" />
        </button>
        <label className="sr-only" htmlFor="aspect">
          Aspect ratio
        </label>
        <select
          id="aspect"
          value={timeline.aspect}
          onChange={(e) => edit((t) => ({ ...t, aspect: e.target.value as Aspect }))}
          className="h-8 cursor-pointer rounded-md border border-white/15 bg-zinc-900 px-2 text-xs"
        >
          {(Object.keys(ASPECTS) as Aspect[]).map((a) => (
            <option key={a} value={a}>
              {a} {ASPECTS[a].label}
            </option>
          ))}
        </select>
        <ExportButton
          workspaceId={workspaceId}
          projectId={project.id}
          disabled={timelineDuration(timeline) === 0 || saving || Boolean(saveError?.conflict)}
          flush={flush}
        />
      </header>

      {saveError?.conflict && (
        <div className="flex flex-wrap items-center gap-3 border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
          <span className="flex-1">
            This project was changed in another tab or by a teammate, so this tab stopped saving. Reload to get the
            latest version (changes made here since are lost).
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-md bg-amber-400/20 px-3 py-1 font-medium hover:bg-amber-400/30"
          >
            Reload
          </button>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        <aside
          aria-label="Media"
          className={`${sidePanel} left-0 border-r border-white/10 ${panel === "media" ? "flex" : "hidden"}`}
        >
          <MediaPanel workspaceId={workspaceId} onAdd={addMedia} adding={adding > 0} />
        </aside>

        <section aria-label="Preview" className="flex min-w-0 flex-1 flex-col">
          <div className="flex gap-2 px-3 pt-2 lg:hidden">
            {(["media", "edit"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPanel((current) => (current === p ? null : p))}
                aria-pressed={panel === p}
                className="cursor-pointer rounded-md bg-white/10 px-3 py-1 text-xs font-medium capitalize aria-pressed:bg-indigo-500"
              >
                {p === "media" ? "Media" : "Edit"}
              </button>
            ))}
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center p-3 [container-type:size] sm:p-5">
            <div
              className="overflow-hidden rounded-md bg-black shadow-2xl ring-1 ring-white/10"
              style={{ width: `min(100cqw, calc(100cqh * ${width} / ${height}))`, aspectRatio: `${width} / ${height}` }}
            >
              <Player
                ref={playerRef}
                component={EditorComposition}
                inputProps={inputProps}
                durationInFrames={totalFrames}
                compositionWidth={width}
                compositionHeight={height}
                fps={FPS}
                style={{ width: "100%", height: "100%" }}
                controls={false}
                clickToPlay
                doubleClickToFullscreen
                spaceKeyToPlayOrPause={false}
                acknowledgeRemotionLicense
                errorFallback={({ error }) => (
                  <div className="flex size-full items-center justify-center p-6 text-center text-sm text-red-300">
                    The preview stopped: {error.message}
                  </div>
                )}
              />
            </div>
            {timeline.clips.length === 0 && timeline.texts.length === 0 && (
              <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-sm text-zinc-400">
                Add videos and images from the media panel, then trim, split and caption them on the timeline.
              </p>
            )}
            {notice && (
              <p
                role="alert"
                className="absolute bottom-4 left-1/2 max-w-md -translate-x-1/2 rounded-md bg-zinc-800 px-4 py-2 text-center text-sm text-zinc-100 shadow-lg ring-1 ring-white/10"
              >
                {notice}
              </p>
            )}
          </div>
        </section>

        <aside
          aria-label="Properties"
          className={`${sidePanel} right-0 border-l border-white/10 ${panel === "edit" ? "flex" : "hidden"}`}
        >
          <Inspector
            timeline={timeline}
            selection={selected}
            sources={sources}
            onEdit={edit}
            onGestureStart={gestureStart}
            onGestureEnd={gestureEnd}
            onDelete={removeSelected}
            onSeek={seek}
          />
        </aside>
      </div>

      <TimelinePanel
        timeline={timeline}
        sources={sources}
        time={time}
        playing={playing}
        selection={selected}
        onSelect={setSelection}
        onSeek={seek}
        onTogglePlay={togglePlay}
        onSplit={split}
        onDelete={removeSelected}
        onAddText={addText}
        onEdit={edit}
        onGestureStart={gestureStart}
        onGestureEnd={gestureEnd}
      />
    </div>
  );
}
