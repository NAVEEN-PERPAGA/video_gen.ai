"use client";

import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { MusicIcon, PauseIcon, PlayIcon, PlusIcon, ScissorsIcon, TextIcon, TrashIcon } from "@/app/generate/icons";
import {
  moveClip,
  moveSpan,
  type Selection,
  type Track,
  trimSpan,
  trimVisual,
  updateItem,
} from "@/lib/editor/edit";
import { formatTime } from "@/lib/editor/media";
import {
  type AudioClip,
  clipStarts,
  mediaKey,
  type TextClip,
  type Timeline,
  timelineDuration,
  type VisualClip,
} from "@/lib/editor/timeline";

/** Zoom limits, in pixels per second. */
const MIN_PPS = 4;
const MAX_PPS = 240;
/** Movement (px) before a press on a clip becomes a drag instead of a click. */
const DRAG_THRESHOLD = 4;
/** Room after the last clip, so there's somewhere to drop and scroll to. */
const TAIL_SECONDS = 8;
const ROW = { ruler: 24, clips: 60, texts: 34, audio: 34 } as const;

type Edge = "start" | "end";
type Drag =
  | { kind: "reorder"; index: number; startX: number; moved: boolean }
  | { kind: "trim"; track: Track; id: string; edge: Edge; origin: VisualClip | TextClip | AudioClip; startX: number; moved: boolean }
  | { kind: "move"; track: "texts" | "audio"; id: string; origin: TextClip | AudioClip; startX: number; moved: boolean }
  | { kind: "scrub" };

interface Props {
  timeline: Timeline;
  sources: Record<string, string>;
  time: number;
  playing: boolean;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  onSeek: (seconds: number) => void;
  onTogglePlay: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onAddText: () => void;
  onEdit: (fn: (t: Timeline) => Timeline | null, record?: boolean) => void;
  onGestureStart: () => void;
  onGestureEnd: () => void;
}

/**
 * The timeline: a ruler and three tracks. The main track's clips play back
 * to back (drag to reorder, drag an edge to trim); text and audio clips sit
 * at their own times (drag to move, drag an edge to trim). Click the ruler
 * to seek, drag it to scrub.
 */
export function TimelinePanel({
  timeline,
  sources,
  time,
  playing,
  selection,
  onSelect,
  onSeek,
  onTogglePlay,
  onSplit,
  onDelete,
  onAddText,
  onEdit,
  onGestureStart,
  onGestureEnd,
}: Props) {
  const duration = timelineDuration(timeline);
  // Fits about a minute in a typical window, more for longer videos.
  const [pps, setPps] = useState(() => clampPps(900 / Math.max(duration, 20)));
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  /** While reordering: how far the dragged clip has moved (px), and where it would land. */
  const [reorder, setReorder] = useState<{ index: number; offset: number; target: number } | null>(null);

  const starts = clipStarts(timeline);
  const width = (Math.max(duration, 1) + TAIL_SECONDS) * pps;

  // Keep the playhead in view while playing.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !playing) return;
    const x = time * pps;
    if (x < el.scrollLeft || x > el.scrollLeft + el.clientWidth - 40) el.scrollLeft = Math.max(0, x - 40);
  }, [time, pps, playing]);

  function secondsAt(clientX: number) {
    const rect = contentRef.current?.getBoundingClientRect();
    return rect ? Math.max(0, (clientX - rect.left) / pps) : 0;
  }

  function fit() {
    const el = scrollRef.current;
    if (el) setPps(clampPps((el.clientWidth - 40) / Math.max(duration, 1)));
  }

  // --- Pointer handling (shared by every draggable element) -------------------------

  function begin(e: ReactPointerEvent, d: Drag) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = d;
    if (d.kind === "scrub") onSeek(secondsAt(e.clientX));
  }

  function move(e: ReactPointerEvent) {
    const d = drag.current;
    if (!d) return;
    // The capturing element handles it; its ancestors' handlers mustn't too.
    e.stopPropagation();
    if (d.kind === "scrub") {
      onSeek(secondsAt(e.clientX));
      return;
    }
    const dx = e.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      d.moved = true;
      if (d.kind !== "reorder") onGestureStart();
    }
    const delta = dx / pps;
    if (d.kind === "reorder") {
      setReorder({ index: d.index, offset: dx, target: dropIndex(timeline, starts, d.index, delta) });
    } else if (d.kind === "trim") {
      const next =
        d.track === "clips"
          ? trimVisual(d.origin as VisualClip, d.edge, delta)
          : trimSpan(d.origin as TextClip | AudioClip, d.edge, delta);
      onEdit((t) => updateItem(t, d.track, d.id, next), false);
    } else {
      const next = moveSpan(d.origin, delta);
      onEdit((t) => updateItem(t, d.track, d.id, next), false);
    }
  }

  function end(e: ReactPointerEvent) {
    const d = drag.current;
    if (!d) return;
    e.stopPropagation();
    drag.current = null;
    if (d.kind === "scrub" || !d.moved) return;
    if (d.kind === "reorder") {
      const target = reorder?.target ?? d.index;
      setReorder(null);
      onEdit((t) => moveClip(t, d.index, target));
    } else {
      onGestureEnd();
    }
  }

  const pointer = { onPointerMove: move, onPointerUp: end, onPointerCancel: end };

  function select(e: ReactPointerEvent, track: Track, id: string) {
    onSelect({ track, id });
    // Focus stays out of inputs, so keyboard shortcuts work right away.
    (document.activeElement as HTMLElement | null)?.blur?.();
    e.preventDefault();
  }

  const isSelected = (track: Track, id: string) => selection?.track === track && selection.id === id;

  return (
    <section aria-label="Timeline" className="flex h-64 shrink-0 flex-col border-t border-white/10 bg-zinc-900/60 select-none">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-white/10 px-2">
        <ToolButton label={playing ? "Pause (Space)" : "Play (Space)"} onClick={onTogglePlay}>
          {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
        </ToolButton>
        <span className="px-1 font-mono text-xs whitespace-nowrap text-zinc-300 tabular-nums">
          {formatTime(time)} / {formatTime(duration)}
        </span>
        <ToolButton label="Split at playhead (S)" onClick={onSplit}>
          <ScissorsIcon className="size-4" />
        </ToolButton>
        <ToolButton label="Delete selected (Delete)" onClick={onDelete} disabled={!selection}>
          <TrashIcon className="size-4" />
        </ToolButton>
        <ToolButton label="Add text at playhead" onClick={onAddText}>
          <TextIcon className="size-4" />
          <PlusIcon className="-ml-1 size-3" />
        </ToolButton>
        <div className="flex-1" />
        <button
          type="button"
          onClick={fit}
          className="cursor-pointer rounded px-2 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          Fit
        </button>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="sr-only sm:not-sr-only">Zoom</span>
          <input
            type="range"
            min={Math.log(MIN_PPS)}
            max={Math.log(MAX_PPS)}
            step={0.01}
            value={Math.log(pps)}
            onChange={(e) => setPps(clampPps(Math.exp(Number(e.target.value))))}
            className="w-24 accent-indigo-500 sm:w-32"
          />
        </label>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Track names, aligned with the rows on the right. */}
        <div className="w-16 shrink-0 border-r border-white/10 text-[11px] font-medium text-zinc-500">
          <div style={{ height: ROW.ruler }} />
          <div style={{ height: ROW.clips }} className="flex items-center px-2">
            Video
          </div>
          <div style={{ height: ROW.texts }} className="flex items-center px-2">
            Text
          </div>
          <div style={{ height: ROW.audio }} className="flex items-center px-2">
            Audio
          </div>
        </div>

        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div
            ref={contentRef}
            className="relative"
            style={{ width, minWidth: "100%" }}
            // A press on empty track space selects nothing and moves the playhead there.
            onPointerDown={(e) => {
              onSelect(null);
              begin(e, { kind: "scrub" });
            }}
            {...pointer}
          >
            <Ruler pps={pps} width={width} height={ROW.ruler} />

            {/* Main track */}
            <div className="relative border-b border-white/5" style={{ height: ROW.clips }}>
              {timeline.clips.map((clip, i) => {
                const dragging = reorder?.index === i;
                return (
                  <div
                    key={clip.id}
                    role="button"
                    tabIndex={-1}
                    aria-label={`${clip.kind === "video" ? "Video" : "Image"} clip ${i + 1}, ${formatTime(clip.duration)}`}
                    aria-pressed={isSelected("clips", clip.id)}
                    onPointerDown={(e) => {
                      select(e, "clips", clip.id);
                      begin(e, { kind: "reorder", index: i, startX: e.clientX, moved: false });
                    }}
                    {...pointer}
                    className={`group absolute top-1.5 bottom-1.5 cursor-grab overflow-hidden rounded-md border bg-indigo-500/25 active:cursor-grabbing ${
                      isSelected("clips", clip.id) ? "border-white ring-1 ring-white" : "border-indigo-400/60"
                    } ${sources[mediaKey(clip.media)] ? "" : "border-red-400 bg-red-500/20"} ${dragging ? "z-10 opacity-80 shadow-xl" : ""}`}
                    style={{
                      left: starts[i] * pps,
                      width: Math.max(clip.duration * pps, 6),
                      transform: dragging ? `translateX(${reorder.offset}px)` : undefined,
                    }}
                  >
                    <Thumbnail clip={clip} src={sources[mediaKey(clip.media)]} />
                    <span className="pointer-events-none absolute bottom-0.5 left-1.5 truncate text-[10px] font-medium text-white drop-shadow">
                      {sources[mediaKey(clip.media)] ? formatTime(clip.duration) : "Missing media"}
                    </span>
                    <TrimHandle
                      edge="start"
                      onPointerDown={(e) => {
                        select(e, "clips", clip.id);
                        begin(e, { kind: "trim", track: "clips", id: clip.id, edge: "start", origin: clip, startX: e.clientX, moved: false });
                      }}
                      pointer={pointer}
                    />
                    <TrimHandle
                      edge="end"
                      onPointerDown={(e) => {
                        select(e, "clips", clip.id);
                        begin(e, { kind: "trim", track: "clips", id: clip.id, edge: "end", origin: clip, startX: e.clientX, moved: false });
                      }}
                      pointer={pointer}
                    />
                  </div>
                );
              })}
              {reorder && reorder.target !== reorder.index && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white"
                  style={{ left: insertionX(timeline, starts, reorder.index, reorder.target) * pps }}
                />
              )}
            </div>

            <SpanTrack
              track="texts"
              items={timeline.texts}
              height={ROW.texts}
              pps={pps}
              isSelected={isSelected}
              color="border-amber-400/60 bg-amber-500/25"
              label={(t) => (t as TextClip).text}
              icon={<TextIcon className="size-3 shrink-0" />}
              select={select}
              begin={begin}
              pointer={pointer}
              missing={() => false}
            />
            <SpanTrack
              track="audio"
              items={timeline.audio}
              height={ROW.audio}
              pps={pps}
              isSelected={isSelected}
              color="border-emerald-400/60 bg-emerald-500/25"
              label={(a) => `${Math.round((a as AudioClip).volume * 100)}%`}
              icon={<MusicIcon className="size-3 shrink-0" />}
              select={select}
              begin={begin}
              pointer={pointer}
              missing={(a) => !sources[mediaKey((a as AudioClip).media)]}
            />

            {/* Playhead */}
            <div className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-red-400" style={{ left: time * pps }}>
              <div className="absolute -top-px -left-[5px] size-[11px] rotate-45 rounded-sm bg-red-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function clampPps(pps: number) {
  return Math.min(Math.max(pps, MIN_PPS), MAX_PPS);
}

/** Where the main track's clip `index` would land if its middle were moved by `delta` seconds. */
function dropIndex(timeline: Timeline, starts: number[], index: number, delta: number): number {
  const clip = timeline.clips[index];
  const middle = starts[index] + clip.duration / 2 + delta;
  let target = 0;
  timeline.clips.forEach((c, i) => {
    if (i !== index && starts[i] + c.duration / 2 < middle) target++;
  });
  return target;
}

/** Where the insertion marker goes (seconds) for moving `index` to `target`. */
function insertionX(timeline: Timeline, starts: number[], index: number, target: number): number {
  const others = timeline.clips.map((c, i) => ({ c, start: starts[i] })).filter((_, i) => i !== index);
  if (target >= others.length) {
    const last = timeline.clips.at(-1);
    return last ? starts[timeline.clips.length - 1] + last.duration : 0;
  }
  return others[target].start;
}

function Ruler({ pps, width, height }: { pps: number; width: number; height: number }) {
  // The smallest tick spacing that leaves room for a label.
  const step = [0.5, 1, 2, 5, 10, 15, 30, 60, 120].find((s) => s * pps >= 64) ?? 120;
  const ticks = Array.from({ length: Math.floor(width / pps / step) + 1 }, (_, i) => i * step);
  return (
    <div className="relative cursor-pointer border-b border-white/10" style={{ height }}>
      {ticks.map((t) => (
        <div key={t} className="absolute top-0 bottom-0 border-l border-white/15" style={{ left: t * pps }}>
          <span className="absolute top-1 left-1 font-mono text-[10px] text-zinc-500">
            {formatTime(t, { tenths: step < 1 })}
          </span>
        </div>
      ))}
    </div>
  );
}

/** First frame of a video clip (from its trim point), or the image, behind the clip's label. */
function Thumbnail({ clip, src }: { clip: VisualClip; src: string | undefined }) {
  if (!src) return null;
  return clip.kind === "image" ? (
    // eslint-disable-next-line @next/next/no-img-element -- workspace media on R2 / Runware's CDN
    <img src={src} alt="" draggable={false} className="pointer-events-none h-full w-auto max-w-none object-cover opacity-80" />
  ) : (
    <video
      // A media fragment shows the frame at the trim point without playing.
      src={`${src}#t=${clip.trimStart + 0.05}`}
      muted
      playsInline
      preload="metadata"
      className="pointer-events-none h-full w-auto max-w-none object-cover opacity-80"
    />
  );
}

type PointerHandlers = {
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: (e: ReactPointerEvent) => void;
};

function TrimHandle({
  edge,
  onPointerDown,
  pointer,
}: {
  edge: Edge;
  onPointerDown: (e: ReactPointerEvent) => void;
  pointer: PointerHandlers;
}) {
  return (
    <div
      aria-hidden="true"
      onPointerDown={onPointerDown}
      {...pointer}
      className={`absolute top-0 bottom-0 w-2 cursor-ew-resize bg-white/0 transition group-hover:bg-white/40 hover:!bg-white/70 ${
        edge === "start" ? "left-0 rounded-l-md" : "right-0 rounded-r-md"
      }`}
    />
  );
}

/** A track of clips placed at their own start times: text or audio. */
function SpanTrack({
  track,
  items,
  height,
  pps,
  isSelected,
  color,
  label,
  icon,
  select,
  begin,
  pointer,
  missing,
}: {
  track: "texts" | "audio";
  items: (TextClip | AudioClip)[];
  height: number;
  pps: number;
  isSelected: (track: Track, id: string) => boolean;
  color: string;
  label: (item: TextClip | AudioClip) => string;
  icon: ReactNode;
  select: (e: ReactPointerEvent, track: Track, id: string) => void;
  begin: (e: ReactPointerEvent, d: Drag) => void;
  pointer: PointerHandlers;
  missing: (item: TextClip | AudioClip) => boolean;
}) {
  return (
    <div className="relative border-b border-white/5" style={{ height }}>
      {items.map((item) => (
        <div
          key={item.id}
          role="button"
          tabIndex={-1}
          aria-label={`${track === "texts" ? "Text" : "Audio"} at ${formatTime(item.start)}`}
          aria-pressed={isSelected(track, item.id)}
          onPointerDown={(e) => {
            select(e, track, item.id);
            begin(e, { kind: "move", track, id: item.id, origin: item, startX: e.clientX, moved: false });
          }}
          {...pointer}
          className={`group absolute top-1 bottom-1 flex cursor-grab items-center gap-1 overflow-hidden rounded border px-2 text-[11px] text-white active:cursor-grabbing ${color} ${
            isSelected(track, item.id) ? "!border-white ring-1 ring-white" : ""
          } ${missing(item) ? "!border-red-400 !bg-red-500/20" : ""}`}
          style={{ left: item.start * pps, width: Math.max(item.duration * pps, 6) }}
        >
          {icon}
          <span className="pointer-events-none truncate">{missing(item) ? "Missing media" : label(item)}</span>
          <TrimHandle
            edge="start"
            onPointerDown={(e) => {
              select(e, track, item.id);
              begin(e, { kind: "trim", track, id: item.id, edge: "start", origin: item, startX: e.clientX, moved: false });
            }}
            pointer={pointer}
          />
          <TrimHandle
            edge="end"
            onPointerDown={(e) => {
              select(e, track, item.id);
              begin(e, { kind: "trim", track, id: item.id, edge: "end", origin: item, startX: e.clientX, moved: false });
            }}
            pointer={pointer}
          />
        </div>
      ))}
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-1.5 text-zinc-200 transition hover:bg-white/10 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
