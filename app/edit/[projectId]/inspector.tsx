"use client";

import type { ReactNode } from "react";
import { AlertIcon, TrashIcon } from "@/app/generate/icons";
import { findItem, type Selection, snap, trimSpan, trimVisual, updateItem } from "@/lib/editor/edit";
import { formatTime } from "@/lib/editor/media";
import {
  type AudioClip,
  clipStarts,
  LIMITS,
  mediaKey,
  type TextClip,
  type Timeline,
  timelineDuration,
  type VisualClip,
} from "@/lib/editor/timeline";

interface Props {
  timeline: Timeline;
  selection: Selection;
  sources: Record<string, string>;
  onEdit: (fn: (t: Timeline) => Timeline | null, record?: boolean) => void;
  onGestureStart: () => void;
  onGestureEnd: () => void;
  onDelete: () => void;
  onSeek: (seconds: number) => void;
}

/**
 * Properties of the selected clip, text or audio. Fields edit live without
 * filling the undo history: everything changed while a field has focus is
 * one undo step (onGestureStart on focus, onGestureEnd on blur).
 */
export function Inspector(props: Props) {
  const { timeline, selection } = props;
  const item = findItem(timeline, selection);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 text-sm">
      {!selection || !item ? (
        <ProjectInfo timeline={timeline} />
      ) : selection.track === "clips" ? (
        <ClipFields {...props} clip={item as VisualClip} />
      ) : selection.track === "texts" ? (
        <TextFields {...props} text={item as TextClip} />
      ) : (
        <AudioFields {...props} audio={item as AudioClip} />
      )}
    </div>
  );
}

function ProjectInfo({ timeline }: { timeline: Timeline }) {
  return (
    <div className="flex flex-col gap-4 text-zinc-400">
      <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Project</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        <dt>Length</dt>
        <dd className="text-zinc-200">{formatTime(timelineDuration(timeline))}</dd>
        <dt>Clips</dt>
        <dd className="text-zinc-200">{timeline.clips.length}</dd>
        <dt>Texts</dt>
        <dd className="text-zinc-200">{timeline.texts.length}</dd>
        <dt>Audio</dt>
        <dd className="text-zinc-200">{timeline.audio.length}</dd>
      </dl>
      <p className="text-xs leading-relaxed">Select something on the timeline to edit it.</p>
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Shortcuts</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          {[
            ["Space", "Play / pause"],
            ["S", "Split at the playhead"],
            ["Delete", "Delete the selection"],
            ["← →", "Step a frame (Shift: a second)"],
            ["Ctrl+Z", "Undo (Shift: redo)"],
          ].map(([key, what]) => (
            <div key={key} className="contents">
              <dt>
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-zinc-200">{key}</kbd>
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function ClipFields({ clip, timeline, sources, onEdit, onGestureStart, onGestureEnd, onDelete, onSeek }: Props & { clip: VisualClip }) {
  const index = timeline.clips.findIndex((c) => c.id === clip.id);
  const start = clipStarts(timeline)[index] ?? 0;
  const set = (next: VisualClip, record = false) => onEdit((t) => updateItem(t, "clips", clip.id, next), record);
  const live = { onFocus: onGestureStart, onBlur: onGestureEnd };

  return (
    <Fields title={clip.kind === "video" ? `Video clip ${index + 1}` : `Image clip ${index + 1}`} onDelete={onDelete}>
      {!sources[mediaKey(clip.media)] && <Missing />}
      <Field label="Starts at" group>
        <button type="button" onClick={() => onSeek(start)} className="text-left text-indigo-300 hover:underline">
          {formatTime(start)}
        </button>
      </Field>
      <Field label="Duration (s)">
        <NumberInput
          value={clip.duration}
          min={LIMITS.minClipSeconds}
          max={clip.sourceDuration === null ? LIMITS.durationSeconds : clip.sourceDuration - clip.trimStart}
          onChange={(v) => set(trimVisual(clip, "end", v - clip.duration))}
          {...live}
        />
      </Field>
      {clip.kind === "video" && clip.sourceDuration !== null && (
        <>
          <Field label="Starts in source (s)">
            <NumberInput
              value={clip.trimStart}
              min={0}
              max={clip.trimStart + clip.duration - LIMITS.minClipSeconds}
              onChange={(v) => set(trimVisual(clip, "start", v - clip.trimStart))}
              {...live}
            />
          </Field>
          <p className="text-xs text-zinc-500">
            Uses {formatTime(clip.trimStart)}–{formatTime(clip.trimStart + clip.duration)} of {formatTime(clip.sourceDuration)}.
          </p>
          <Field label={`Volume ${Math.round(clip.volume * 100)}%`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={clip.volume}
              onChange={(e) => set({ ...clip, volume: Number(e.target.value) })}
              className="accent-indigo-500"
              {...live}
            />
          </Field>
        </>
      )}
      <Field label="Framing" group>
        <Segmented
          value={clip.fit}
          options={[
            ["contain", "Fit"],
            ["cover", "Fill"],
          ]}
          onChange={(fit) => set({ ...clip, fit }, true)}
        />
      </Field>
    </Fields>
  );
}

function TextFields({ text, onEdit, onGestureStart, onGestureEnd, onDelete }: Props & { text: TextClip }) {
  const set = (patch: Partial<TextClip>, record = false) =>
    onEdit((t) => updateItem<TextClip>(t, "texts", text.id, patch), record);
  const live = { onFocus: onGestureStart, onBlur: onGestureEnd };

  return (
    <Fields title="Text" onDelete={onDelete}>
      <Field label="Text">
        <textarea
          value={text.text}
          maxLength={LIMITS.textLength}
          rows={3}
          // An empty caption isn't valid: keep the last character until it's replaced.
          onChange={(e) => e.target.value && set({ text: e.target.value })}
          className="resize-y rounded-md border border-white/15 bg-zinc-900 px-2 py-1.5"
          {...live}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts at (s)">
          <NumberInput value={text.start} min={0} max={LIMITS.durationSeconds} onChange={(v) => set({ start: snap(v) })} {...live} />
        </Field>
        <Field label="Duration (s)">
          <NumberInput
            value={text.duration}
            min={LIMITS.minClipSeconds}
            max={LIMITS.durationSeconds}
            onChange={(v) => set(trimSpan(text, "end", v - text.duration))}
            {...live}
          />
        </Field>
      </div>
      <Field label="Position" group>
        <Segmented
          value={text.position}
          options={[
            ["top", "Top"],
            ["center", "Middle"],
            ["bottom", "Bottom"],
          ]}
          onChange={(position) => set({ position }, true)}
        />
      </Field>
      <Field label={`Size ${text.size}`}>
        <input
          type="range"
          min={2}
          max={20}
          step={0.5}
          value={text.size}
          onChange={(e) => set({ size: Number(e.target.value) })}
          className="accent-indigo-500"
          {...live}
        />
      </Field>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          Color
          <input
            type="color"
            value={text.color}
            onChange={(e) => set({ color: e.target.value })}
            className="h-7 w-10 cursor-pointer rounded border border-white/15 bg-transparent"
            {...live}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={text.background}
            onChange={(e) => set({ background: e.target.checked }, true)}
            className="accent-indigo-500"
          />
          Background
        </label>
      </div>
    </Fields>
  );
}

function AudioFields({ audio, sources, onEdit, onGestureStart, onGestureEnd, onDelete }: Props & { audio: AudioClip }) {
  const set = (next: AudioClip, record = false) => onEdit((t) => updateItem(t, "audio", audio.id, next), record);
  const live = { onFocus: onGestureStart, onBlur: onGestureEnd };

  return (
    <Fields title="Audio" onDelete={onDelete}>
      {!sources[mediaKey(audio.media)] && <Missing />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts at (s)">
          <NumberInput
            value={audio.start}
            min={0}
            max={LIMITS.durationSeconds}
            onChange={(v) => set({ ...audio, start: snap(v) })}
            {...live}
          />
        </Field>
        <Field label="Duration (s)">
          <NumberInput
            value={audio.duration}
            min={LIMITS.minClipSeconds}
            max={audio.sourceDuration - audio.trimStart}
            onChange={(v) => set(trimSpan(audio, "end", v - audio.duration))}
            {...live}
          />
        </Field>
      </div>
      <p className="text-xs text-zinc-500">
        Plays {formatTime(audio.trimStart)}–{formatTime(audio.trimStart + audio.duration)} of {formatTime(audio.sourceDuration)}.
      </p>
      <Field label={`Volume ${Math.round(audio.volume * 100)}%`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={audio.volume}
          onChange={(e) => set({ ...audio, volume: Number(e.target.value) })}
          className="accent-indigo-500"
          {...live}
        />
      </Field>
    </Fields>
  );
}

// --- Building blocks ---------------------------------------------------------------------

function Fields({ title, onDelete, children }: { title: string; onDelete: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">{title}</h2>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${title.toLowerCase()}`}
          title="Delete"
          className="flex size-7 cursor-pointer items-center justify-center rounded-md text-zinc-400 hover:bg-red-500/15 hover:text-red-300"
        >
          <TrashIcon className="size-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

/**
 * A labelled control. `group` for buttons: a <label> would pass its clicks
 * on to the first button inside it.
 */
function Field({ label, group, children }: { label: string; group?: boolean; children: ReactNode }) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className="flex flex-col gap-1.5 text-xs text-zinc-400">
      {label}
      {children}
    </Tag>
  );
}

/** A number field that only reports values within [min, max]. */
function NumberInput({
  value,
  min,
  max,
  onChange,
  onFocus,
  onBlur,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <input
      type="number"
      value={Number(value.toFixed(2))}
      min={min}
      max={Number(max.toFixed(2))}
      step={0.1}
      onChange={(e) => {
        const v = e.target.valueAsNumber;
        if (Number.isFinite(v)) onChange(Math.min(Math.max(v, min), max));
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      className="rounded-md border border-white/15 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 tabular-nums"
    />
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" className="flex rounded-md bg-zinc-900 p-0.5 ring-1 ring-white/10">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className="flex-1 cursor-pointer rounded px-2 py-1 text-xs text-zinc-300 transition aria-checked:bg-indigo-500 aria-checked:text-white"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Missing() {
  return (
    <p className="flex items-start gap-2 rounded-md bg-red-500/10 p-2 text-xs text-red-300">
      <AlertIcon className="mt-0.5 size-4 shrink-0" />
      This clip&apos;s media was deleted or isn&apos;t ready. Replace or delete the clip before exporting.
    </p>
  );
}
