"use client";

import {
  type ComponentType,
  type ReactNode,
  type SVGProps,
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { type GenerateState, generateVideo } from "@/app/generate/actions";
import { Dropdown, type DropdownOption } from "@/app/generate/dropdown";
import {
  AlertIcon,
  ArrowUpIcon,
  AspectIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  DiceIcon,
  FileIcon,
  FilmIcon,
  GaugeIcon,
  HashIcon,
  ImageIcon,
  InfoIcon,
  LayersIcon,
  LinkIcon,
  MicIcon,
  MusicIcon,
  PencilIcon,
  PlusIcon,
  SlidersIcon,
  SparklesIcon,
  XIcon,
} from "@/app/generate/icons";
import { ModelPicker } from "@/app/generate/model-picker";
import { defaultModelId, getVideoModel, type FieldSchema, type VideoModel } from "@/lib/runware/models";
import {
  type AssetKind,
  assetKinds,
  autoAdjust,
  checkValues,
  choices,
  type ComposerValues,
  fpsOptions,
  humanize,
  initialValues,
  type MediaKind,
  numberOptions,
  sizeOptions,
} from "@/lib/runware/request";
import { type CostEstimate, estimateCost, formatCost } from "@/lib/runware/pricing";
import { useDismiss } from "@/lib/use-dismiss";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const MEDIA_ICONS: Record<MediaKind, IconType> = {
  image: ImageIcon,
  video: FilmIcon,
  audio: MusicIcon,
  document: FileIcon,
  link: LinkIcon,
  text: HashIcon,
};

const SETTING_ICONS: Record<string, IconType> = {
  audio: MusicIcon,
  cameraMovement: CameraIcon,
  promptExtend: SparklesIcon,
  enhancePrompt: SparklesIcon,
  promptExpansion: SparklesIcon,
  draft: PencilIcon,
  operation: FilmIcon,
};

const pillBase =
  "relative flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition";
const pillIdle =
  "border-black/10 text-zinc-700 hover:bg-black/[0.04] dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.06]";
const pillActive =
  "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/15 dark:text-violet-300";
const fieldInput =
  "w-full rounded-lg border border-black/10 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 dark:border-white/15";

function newId() {
  return Math.random().toString(36).slice(2);
}

/** Keep the prompt and any attachments the new model also accepts. */
function carryOver(model: VideoModel, prev: ComposerValues): ComposerValues {
  const next = initialValues(model);
  next.prompt = prev.prompt;
  for (const kind of assetKinds(model)) {
    const items = prev.assets[kind.key];
    if (items?.length) {
      next.assets[kind.key] = items.slice(0, kind.max).map((i) => ({
        ...i,
        frame: i.frame && kind.framePositions.includes(i.frame) ? i.frame : undefined,
      }));
    }
  }
  return autoAdjust(model, next);
}

function modeLabel(model: VideoModel, v: ComposerValues) {
  const kinds = assetKinds(model).filter((k) => v.assets[k.key]?.length);
  if (kinds.some((k) => k.key === "draftCache")) return "Finalise draft";
  if (kinds.some((k) => k.key === "video")) return "Video to video";
  if (kinds.some((k) => k.media === "audio")) return "Audio to video";
  if (kinds.some((k) => k.key === "frameImages")) return "Image to video";
  if (kinds.some((k) => k.media === "video")) return "Video reference";
  if (kinds.some((k) => k.media === "image")) return "Image reference";
  return "Text to video";
}

export function VideoComposer() {
  const [modelId, setModelId] = useState(defaultModelId);
  const model = getVideoModel(modelId)!;
  const [values, setValues] = useState<ComposerValues>(() => initialValues(model));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<GenerateState>();
  const [pending, startTransition] = useTransition();

  const errors = useMemo(() => checkValues(model, values), [model, values]);
  const cost = useMemo(() => estimateCost(model, values), [model, values]);
  const input = model.input;
  const kinds = assetKinds(model);
  const promptMax = input.positivePrompt?.maxLength;

  const update = (patch: Partial<ComposerValues>) => setValues((v) => ({ ...v, ...patch }));
  const setSetting = (key: string, value: boolean | string | number | undefined) =>
    setValues((v) => ({ ...v, settings: { ...v.settings, [key]: value } }));
  // Attachments change which sizes/durations are valid, so re-fit those.
  const setAssets = (assets: ComposerValues["assets"]) => setValues((v) => autoAdjust(model, { ...v, assets }));

  function selectModel(id: string) {
    const next = getVideoModel(id)!;
    setModelId(id);
    setValues((v) => carryOver(next, v));
    setResult(undefined);
  }

  function submit() {
    if (pending || errors.length > 0) return;
    startTransition(async () => {
      setResult(await generateVideo(model.value, values));
    });
  }

  const settingFields = Object.entries(input.settings?.properties ?? {});
  const toolbarSettings = settingFields.filter(([, f]) => f.type === "boolean" || choices(f).length > 0);
  const numericSettings = settingFields.filter(([, f]) => f.type === "number" || f.type === "integer");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10">
      <div className="h-10 bg-gradient-to-t from-background to-transparent" aria-hidden="true" />
      <div className="bg-background px-3 pb-4 sm:px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="pointer-events-auto relative mx-auto w-full max-w-3xl rounded-[28px] bg-gradient-to-b from-violet-500/25 via-black/10 to-black/5 p-px shadow-[0_12px_48px_-16px_rgba(76,29,149,0.35)] dark:from-violet-400/30 dark:via-white/10 dark:to-white/5"
        >
          <div className="flex flex-col gap-2 rounded-[27px] bg-background/95 p-2.5 backdrop-blur-xl">
            {result && <ResultBanner result={result} onClose={() => setResult(undefined)} />}

            {showAdvanced && (
              <AdvancedPanel
                model={model}
                values={values}
                update={update}
                numericSettings={numericSettings}
                setSetting={setSetting}
              />
            )}

            <AssetTray kinds={kinds} values={values} setAssets={setAssets} />

            <textarea
              value={values.prompt}
              onChange={(e) => update({ prompt: e.target.value })}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter adds a new line.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              maxLength={promptMax}
              placeholder="Describe the shot: subject, motion, camera, lighting, mood…"
              aria-label="Prompt"
              className="max-h-56 min-h-14 resize-none bg-transparent px-2.5 pt-2 text-[15px] leading-relaxed outline-none field-sizing-content placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />

            <div className="flex items-end gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <ModelPicker model={model} onChange={selectModel} />
                {kinds.length > 0 && <AttachMenu kinds={kinds} values={values} setAssets={setAssets} />}

                <span className="mx-0.5 h-5 w-px bg-black/10 dark:bg-white/10" aria-hidden="true" />

                <SizeControl model={model} values={values} update={update} />

                {input.duration && (
                  <SelectPill
                    icon={ClockIcon}
                    label="Duration"
                    value={values.duration === undefined ? "" : String(values.duration)}
                    onChange={(v) => update({ duration: v === "" ? undefined : v === "auto" ? "auto" : Number(v) })}
                    options={[
                      ...(model.required.includes("duration")
                        ? []
                        : [{ value: "", label: defaultLabel(input.duration, (d) => (d === "auto" ? "Auto" : `${d}s`)) }]),
                      ...numberOptions(input.duration).map((d) => ({
                        value: String(d),
                        label: d === "auto" ? "Auto" : `${d}s`,
                      })),
                    ]}
                  />
                )}

                {input.fps && (
                  <SelectPill
                    icon={GaugeIcon}
                    label="Frame rate"
                    value={values.fps === undefined ? "" : String(values.fps)}
                    onChange={(v) => update({ fps: v ? Number(v) : undefined })}
                    options={[
                      { value: "", label: defaultLabel(input.fps, (f) => `${f} fps`, "Auto fps") },
                      ...fpsOptions(input.fps).map((f) => ({ value: String(f), label: `${f} fps` })),
                    ]}
                  />
                )}

                {toolbarSettings.map(([key, field]) =>
                  field.type === "boolean" ? (
                    <TogglePill
                      key={key}
                      icon={SETTING_ICONS[key] ?? SparklesIcon}
                      label={humanize(key)}
                      title={field.description}
                      checked={(values.settings[key] ?? field.default ?? false) as boolean}
                      onChange={(checked) => setSetting(key, checked)}
                    />
                  ) : (
                    <SelectPill
                      key={key}
                      icon={SETTING_ICONS[key] ?? SparklesIcon}
                      label={humanize(key)}
                      value={String(values.settings[key] ?? "")}
                      onChange={(v) => setSetting(key, v || undefined)}
                      options={[
                        { value: "", label: `${humanize(key)}: ${field.default ? humanize(String(field.default)) : "Auto"}` },
                        ...choices(field).map((c) => ({ value: String(c), label: humanize(String(c)) })),
                      ]}
                    />
                  ),
                )}

                {input.speech?.properties?.voices && (
                  <VoicesPill field={input.speech.properties.voices} values={values} update={update} />
                )}

                {input.numberResults && (
                  <SelectPill
                    icon={LayersIcon}
                    label="Number of videos"
                    highlight={false}
                    value={String(values.numberResults)}
                    onChange={(v) => update({ numberResults: Number(v) })}
                    options={Array.from({ length: input.numberResults.maximum ?? 1 }, (_, i) => ({
                      value: String(i + 1),
                      label: `${i + 1}×`,
                    }))}
                  />
                )}

                <button
                  type="button"
                  onClick={() => setShowAdvanced((s) => !s)}
                  aria-expanded={showAdvanced}
                  aria-label="Advanced settings"
                  title="Advanced settings"
                  className={`${pillBase} w-9 justify-center px-0 ${showAdvanced ? pillActive : pillIdle}`}
                >
                  <SlidersIcon className="size-4" />
                </button>
              </div>

              {cost && <CostBadge cost={cost} model={model} invalid={errors.length > 0} />}

              <button
                type="submit"
                disabled={pending || errors.length > 0}
                aria-label="Generate video"
                title={errors.length > 0 ? errors[0] : "Generate (Enter)"}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 transition hover:brightness-110 active:scale-95 disabled:from-zinc-300 disabled:to-zinc-300 disabled:shadow-none dark:disabled:from-zinc-700 dark:disabled:to-zinc-700"
              >
                {pending ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <ArrowUpIcon className="size-5" />
                )}
              </button>
            </div>

            <StatusLine errors={errors} mode={modeLabel(model, values)} length={values.prompt.trim().length} max={promptMax} />
          </div>
        </form>
      </div>
    </div>
  );
}

function defaultLabel<T>(field: FieldSchema, format: (v: T) => string, fallback = "Default") {
  return field.default !== undefined ? `Default · ${format(field.default as T)}` : fallback;
}

/* ───────────────────────── controls ───────────────────────── */

/** A pill showing the current choice with an icon; opens a themed dropdown. */
function SelectPill({
  icon: IconCmp,
  label,
  value,
  onChange,
  options,
  highlight = true,
}: {
  icon: IconType;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  /** Tint the pill when it's changed from its first (default) option. */
  highlight?: boolean;
}) {
  const active = highlight && value !== "" && value !== options[0]?.value;
  return (
    <Dropdown
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      className={`${pillBase} ${active ? pillActive : pillIdle}`}
    >
      {(current) => (
        <>
          <IconCmp className="size-4 opacity-80" />
          <span className="max-w-36 truncate">{(current ?? options[0])?.label}</span>
        </>
      )}
    </Dropdown>
  );
}

/** Form-field styled dropdown for the advanced panel. */
function FieldDropdown({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  disabled?: boolean;
}) {
  return (
    <Dropdown
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      className={`${fieldInput} flex items-center justify-between gap-2 text-left disabled:opacity-40`}
    >
      {(current) => (
        <>
          <span className="truncate">{(current ?? options[0])?.label}</span>
          <ChevronDownIcon className="size-4 shrink-0 text-zinc-500" />
        </>
      )}
    </Dropdown>
  );
}

function TogglePill({
  icon: IconCmp,
  label,
  title,
  checked,
  onChange,
}: {
  icon: IconType;
  label: string;
  title?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      onClick={() => onChange(!checked)}
      className={`${pillBase} ${checked ? pillActive : pillIdle}`}
    >
      <IconCmp className="size-4 opacity-80" />
      {label}
    </button>
  );
}

function SizeControl({
  model,
  values,
  update,
}: {
  model: VideoModel;
  values: ComposerValues;
  update: (patch: Partial<ComposerValues>) => void;
}) {
  const options = sizeOptions(model);
  if (options.length === 0) return null;
  const width = model.input.width;
  return (
    <>
      <SelectPill
        icon={AspectIcon}
        label="Size"
        highlight={false}
        value={values.size}
        onChange={(size) => update({ size })}
        options={options}
      />
      {values.size === "custom" && width && (
        <span className="flex h-9 items-center gap-1 rounded-full border border-black/10 px-2 text-[13px] dark:border-white/10">
          {(["customWidth", "customHeight"] as const).map((key, i) => (
            <span key={key} className="flex items-center gap-1">
              {i === 1 && <span className="text-zinc-400">×</span>}
              <input
                type="number"
                aria-label={i === 0 ? "Width" : "Height"}
                min={width.minimum}
                max={width.maximum}
                step={width.multipleOf ?? 1}
                value={values[key]}
                onChange={(e) => update({ [key]: Number(e.target.value) })}
                className="w-14 bg-transparent text-center tabular-nums outline-none"
              />
            </span>
          ))}
        </span>
      )}
    </>
  );
}

/** Popover anchored above its trigger (the composer sits at the bottom). */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, useCallback(() => setOpen(false), []));
  return { open, setOpen, ref };
}

function Popover({ children, className = "w-72" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`absolute bottom-full left-0 z-30 mb-2 flex max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-2xl border border-black/10 bg-background/95 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 ${className}`}
    >
      {children}
    </div>
  );
}

function VoicesPill({
  field,
  values,
  update,
}: {
  field: FieldSchema;
  values: ComposerValues;
  update: (patch: Partial<ComposerValues>) => void;
}) {
  const { open, setOpen, ref } = usePopover();
  const voices = (field.items?.enum ?? []) as string[];
  const max = field.maxItems ?? 3;
  const selected = values.voices;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`${pillBase} ${selected.length ? pillActive : pillIdle}`}
      >
        <MicIcon className="size-4 opacity-80" />
        {selected.length ? selected.map(humanize).join(", ") : "Voices"}
      </button>
      {open && (
        <Popover className="w-80">
          <div className="text-xs">
            <p className="font-medium">Speech voices · up to {max}</p>
            <p className="mt-0.5 text-zinc-500">
              Refer to them in the prompt as {"<AUDIO_0>"}, {"<AUDIO_1>"}… in the order picked.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {voices.map((voice) => {
              const index = selected.indexOf(voice);
              const on = index !== -1;
              return (
                <button
                  key={voice}
                  type="button"
                  disabled={!on && selected.length >= max}
                  onClick={() =>
                    update({ voices: on ? selected.filter((s) => s !== voice) : [...selected, voice] })
                  }
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-30 ${on ? pillActive : pillIdle}`}
                >
                  {on && <span className="mr-1 tabular-nums opacity-70">{index}</span>}
                  {humanize(voice)}
                </button>
              );
            })}
          </div>
        </Popover>
      )}
    </div>
  );
}

/* ───────────────────────── attachments ───────────────────────── */

function AttachMenu({
  kinds,
  values,
  setAssets,
}: {
  kinds: AssetKind[];
  values: ComposerValues;
  setAssets: (assets: ComposerValues["assets"]) => void;
}) {
  const { open, setOpen, ref } = usePopover();
  const [kind, setKind] = useState<AssetKind | null>(null);
  const [draft, setDraft] = useState("");

  function close() {
    setOpen(false);
    setKind(null);
    setDraft("");
  }

  function attach() {
    if (!kind || !draft.trim()) return;
    const items = values.assets[kind.key] ?? [];
    setAssets({ ...values.assets, [kind.key]: [...items, { id: newId(), value: draft.trim() }] });
    close();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label="Add media"
        title="Add media"
        className={`${pillBase} w-9 justify-center px-0 ${open ? pillActive : pillIdle}`}
      >
        <PlusIcon className={`size-4 transition ${open ? "rotate-45" : ""}`} />
      </button>

      {open && (
        <Popover>
          {kind ? (
            <>
              <label className="flex flex-col gap-1.5 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <MediaIcon media={kind.media} className="size-4 text-violet-600 dark:text-violet-400" />
                  {kind.label}
                </span>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      attach();
                    }
                  }}
                  placeholder={kind.media === "text" ? "Draft cache id" : "https://… or Runware UUID"}
                  className={fieldInput}
                />
              </label>
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setKind(null)}
                  className="rounded-lg px-2.5 py-1 text-xs text-zinc-500 hover:text-foreground"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={attach}
                  disabled={!draft.trim()}
                  className="rounded-lg bg-foreground px-3 py-1 text-xs font-medium text-background disabled:opacity-40"
                >
                  Attach
                </button>
              </div>
            </>
          ) : (
            <ul className="-m-1.5 flex flex-col">
              {kinds.map((k) => {
                const count = values.assets[k.key]?.length ?? 0;
                const full = count >= k.max;
                return (
                  <li key={k.key}>
                    <button
                      type="button"
                      disabled={full}
                      onClick={() => setKind(k)}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-black/[0.04] disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-white/[0.06]"
                    >
                      <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <MediaIcon media={k.media} className="size-4" />
                      </span>
                      <span className="flex-1 font-medium">{k.label}</span>
                      <span className="text-xs tabular-nums text-zinc-500">
                        {count}/{k.max}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Popover>
      )}
    </div>
  );
}

function MediaIcon({ media, className }: { media: MediaKind; className?: string }) {
  const IconCmp = MEDIA_ICONS[media];
  return <IconCmp className={className} />;
}

function AssetTray({
  kinds,
  values,
  setAssets,
}: {
  kinds: AssetKind[];
  values: ComposerValues;
  setAssets: (assets: ComposerValues["assets"]) => void;
}) {
  const entries = kinds.flatMap((kind) => (values.assets[kind.key] ?? []).map((item) => ({ kind, item })));
  if (entries.length === 0) return null;

  const change = (kind: AssetKind, id: string, patch: { frame?: string } | null) => {
    const items = values.assets[kind.key] ?? [];
    const next = patch === null ? items.filter((i) => i.id !== id) : items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setAssets({ ...values.assets, [kind.key]: next });
  };

  return (
    <ul className="flex gap-2 overflow-x-auto px-1 pt-1 pb-0.5">
      {entries.map(({ kind, item }) => (
        <li key={item.id} className="group relative flex w-20 shrink-0 flex-col gap-1">
          <div className="relative size-20 overflow-hidden rounded-xl border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.05]">
            {kind.media === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied URL
              <img src={item.value} alt="" className="size-full object-cover" />
            ) : kind.media === "video" ? (
              <video src={item.value} muted playsInline preload="metadata" className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 p-1.5 text-zinc-500">
                <MediaIcon media={kind.media} className="size-5" />
                <span className="w-full truncate text-center text-[10px]">{item.value}</span>
              </div>
            )}
            <button
              type="button"
              aria-label={`Remove ${kind.label.toLowerCase()}`}
              onClick={() => change(kind, item.id, null)}
              className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-90 backdrop-blur transition hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
            >
              <XIcon className="size-3" />
            </button>
          </div>
          {kind.framePositions.length > 0 ? (
            <Dropdown
              label="Frame position"
              value={item.frame ?? ""}
              onChange={(frame) => change(kind, item.id, { frame: frame || undefined })}
              options={[
                { value: "", label: "Auto", description: "Placed automatically" },
                ...kind.framePositions.map((p) => ({ value: p, label: `${humanize(p)} frame` })),
              ]}
              className="flex w-full items-center justify-center gap-0.5 rounded-md py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-black/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.06]"
            >
              {(current) => (
                <>
                  <span className="truncate">{current?.value ? current.label.replace(" frame", "") : "Auto"}</span>
                  <ChevronDownIcon className="size-3 shrink-0" />
                </>
              )}
            </Dropdown>
          ) : (
            <span className="truncate text-center text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              {kind.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ───────────────────────── advanced & status ───────────────────────── */

function AdvancedPanel({
  model,
  values,
  update,
  numericSettings,
  setSetting,
}: {
  model: VideoModel;
  values: ComposerValues;
  update: (patch: Partial<ComposerValues>) => void;
  numericSettings: [string, FieldSchema][];
  setSetting: (key: string, value: number | undefined) => void;
}) {
  const input = model.input;
  const quality = input.outputQuality;
  const numberOrUndefined = (v: string) => (v === "" ? undefined : Number(v));

  return (
    <div className="scroll-inset max-h-[45vh] overflow-y-auto rounded-2xl bg-black/[0.025] p-3 dark:bg-white/[0.04]">
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 text-xs sm:grid-cols-2">
        {input.seed && (
          <Field label="Seed" hint="Same seed + settings ≈ same video">
            <div className="flex gap-1.5">
              <input
                type="number"
                min={input.seed.minimum}
                value={values.seed ?? ""}
                onChange={(e) => update({ seed: numberOrUndefined(e.target.value) })}
                placeholder="Random"
                className={fieldInput}
              />
              <button
                type="button"
                title="Random seed"
                aria-label="Random seed"
                onClick={() => update({ seed: Math.floor(Math.random() * 2 ** 31) })}
                className="flex w-9 shrink-0 items-center justify-center rounded-lg border border-black/10 text-zinc-600 hover:bg-black/[0.04] dark:border-white/15 dark:text-zinc-400"
              >
                <DiceIcon className="size-4" />
              </button>
            </div>
          </Field>
        )}

        {numericSettings.map(([key, field]) => {
          const value = (values.settings[key] ?? field.default ?? field.minimum ?? 0) as number;
          return (
            <Field key={key} label={humanize(key)} value={String(value)} hint={field.description}>
              <input
                type="range"
                min={field.minimum}
                max={field.maximum}
                step={field.multipleOf ?? (field.type === "integer" ? 1 : 0.01)}
                value={value}
                onChange={(e) => setSetting(key, Number(e.target.value))}
                className="h-8 w-full accent-violet-600"
              />
            </Field>
          );
        })}

        {input.outputFormat && (
          <Field label="Output format">
            <FieldDropdown
              label="Output format"
              value={values.outputFormat ?? ""}
              onChange={(v) => update({ outputFormat: v || undefined })}
              options={[
                { value: "", label: `Default (${String(input.outputFormat.default ?? "MP4")})` },
                ...choices(input.outputFormat).map((f) => ({ value: String(f), label: String(f) })),
              ]}
            />
          </Field>
        )}

        {quality && (
          <Field label="Output quality" value={String(values.outputQuality ?? quality.default ?? "")}>
            <input
              type="range"
              min={quality.minimum}
              max={quality.maximum}
              value={values.outputQuality ?? (quality.default as number) ?? quality.maximum}
              onChange={(e) => update({ outputQuality: Number(e.target.value) })}
              className="h-8 w-full accent-violet-600"
            />
          </Field>
        )}

        {input.safety && (
          <Field label="Content safety check" hint="Adds processing time">
            <div className="flex items-center gap-2">
              <label className="flex shrink-0 items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={values.checkContent}
                  onChange={(e) => update({ checkContent: e.target.checked })}
                  className="accent-violet-600"
                />
                On
              </label>
              <div className="min-w-0 flex-1">
                <FieldDropdown
                  label="Safety mode"
                  value={values.safetyMode ?? ""}
                  disabled={!values.checkContent}
                  onChange={(v) => update({ safetyMode: v || undefined })}
                  options={[
                    { value: "", label: "Default mode" },
                    ...(input.safety.properties?.mode?.oneOf ?? []).map((m) => ({
                      value: String(m.const),
                      label: humanize(String(m.const)),
                      description: m.description,
                    })),
                  ]}
                />
              </div>
            </div>
          </Field>
        )}

        {input.lora && <LoraEditor values={values} update={update} field={input.lora} />}
      </div>

      {model.rules.length > 0 && (
        <details className="mt-3 text-xs">
          <summary className="flex cursor-pointer items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
            <InfoIcon className="size-3.5" />
            {model.name} rules
          </summary>
          <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-400">
            {[...new Set(model.rules)].map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function LoraEditor({
  values,
  update,
  field,
}: {
  values: ComposerValues;
  update: (patch: Partial<ComposerValues>) => void;
  field: FieldSchema;
}) {
  const weight = field.items?.properties?.weight;
  const set = (lora: ComposerValues["lora"]) => update({ lora });
  return (
    <Field label="LoRA" hint="Style adapters, by model AIR id">
      <div className="flex flex-col gap-1.5">
        {values.lora.map((l, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              value={l.model}
              onChange={(e) => set(values.lora.map((x, j) => (j === i ? { ...x, model: e.target.value } : x)))}
              placeholder="civitai:12345@1"
              className={fieldInput}
            />
            <input
              type="number"
              aria-label="Weight"
              min={weight?.minimum}
              max={weight?.maximum}
              step={weight?.multipleOf ?? 0.01}
              value={l.weight}
              onChange={(e) => set(values.lora.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))}
              className={`${fieldInput} w-20 shrink-0`}
            />
            <button
              type="button"
              aria-label="Remove LoRA"
              onClick={() => set(values.lora.filter((_, j) => j !== i))}
              className="shrink-0 px-1 text-zinc-500 hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set([...values.lora, { model: "", weight: (weight?.default as number) ?? 1 }])}
          className="flex items-center gap-1 self-start rounded-lg px-1.5 py-1 font-medium text-violet-700 hover:bg-violet-500/10 dark:text-violet-300"
        >
          <PlusIcon className="size-3.5" /> Add LoRA
        </button>
      </div>
    </Field>
  );
}

function Field({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between gap-2 font-medium">
        <span title={hint}>{label}</span>
        {value !== undefined && <span className="tabular-nums text-zinc-500">{value}</span>}
      </span>
      {children}
    </div>
  );
}

/** Live price next to Generate, with a hover/focus card explaining it. */
function CostBadge({ cost, model, invalid }: { cost: CostEstimate; model: VideoModel; invalid: boolean }) {
  const value = cost.total ?? cost.perSecond;
  const approx = cost.approximate || Array.isArray(value) ? "~" : "";
  const label = value === undefined ? "—" : `${approx}${formatCost(value)}${cost.total === undefined ? "/s" : ""}`;

  return (
    <div className={`group relative mb-0.5 shrink-0 transition-opacity ${invalid ? "opacity-45" : ""}`}>
      <button
        type="button"
        aria-describedby="cost-details"
        className="flex h-9 flex-col items-end justify-center rounded-xl px-2 text-right leading-none outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
      >
        {cost.original !== undefined && (
          <span className="text-[10px] tabular-nums text-zinc-400 line-through">{formatCost(cost.original)}</span>
        )}
        <span className="text-sm font-semibold tabular-nums">{label}</span>
        {cost.original === undefined && <span className="mt-0.5 text-[10px] text-zinc-500">est. cost</span>}
      </button>

      <div
        id="cost-details"
        role="tooltip"
        className="pointer-events-none invisible absolute right-0 bottom-full z-30 mb-2 w-64 translate-y-1 rounded-2xl border border-black/10 bg-background/95 p-3 text-xs opacity-0 shadow-2xl backdrop-blur-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-white/10"
      >
        <p className="flex items-baseline justify-between gap-2 font-medium">
          <span>Estimated cost</span>
          <span className="tabular-nums">{label}</span>
        </p>
        {cost.breakdown.length > 0 && <p className="mt-1 text-zinc-600 dark:text-zinc-400">{cost.breakdown.join(" × ")}</p>}
        {cost.promo && (
          <p className="mt-2 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
            {cost.promo}
          </p>
        )}
        {cost.notes.length > 0 && (
          <ul className="mt-2 space-y-1 text-zinc-500">
            {cost.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 border-t border-black/10 pt-2 text-[11px] text-zinc-500 dark:border-white/10">
          Based on Runware&apos;s published rates for {model.name} (checked {model.pricing?.checked}). Runware
          sets the final cost.
        </p>
      </div>
    </div>
  );
}

function StatusLine({
  errors,
  mode,
  length,
  max,
}: {
  errors: string[];
  mode: string;
  length: number;
  max?: number;
}) {
  // An empty prompt is the starting state, not something to warn about.
  const shown = length === 0 ? errors.filter((e) => e !== "Enter a prompt.") : errors;
  return (
    <div className="flex items-center gap-2 px-2.5 pb-0.5 text-[11px]">
      {shown.length > 0 ? (
        <span className="flex min-w-0 items-center gap-1.5 text-amber-700 dark:text-amber-400" title={shown.join("\n")}>
          <AlertIcon className="size-3.5 shrink-0" />
          <span className="truncate">{shown[0]}</span>
          {shown.length > 1 && <span className="shrink-0 opacity-70">+{shown.length - 1} more</span>}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-zinc-500">
          <span className={`size-1.5 rounded-full ${errors.length === 0 ? "bg-emerald-500" : "bg-zinc-400"}`} />
          {mode}
        </span>
      )}
      <span className="ml-auto shrink-0 tabular-nums text-zinc-400">
        {length}
        {max ? ` / ${max}` : ""}
      </span>
    </div>
  );
}

function ResultBanner({ result, onClose }: { result: NonNullable<GenerateState>; onClose: () => void }) {
  const ok = !result.errors;
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`relative rounded-2xl border p-3 pr-9 text-xs ${
        ok
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          : "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
      }`}
    >
      <button type="button" aria-label="Dismiss" onClick={onClose} className="absolute top-2.5 right-2.5 opacity-70 hover:opacity-100">
        <XIcon className="size-4" />
      </button>
      {ok ? (
        <details>
          <summary className="flex cursor-pointer items-center gap-1.5 font-medium">
            <CheckIcon className="size-4" /> Request ready — view payload
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-black/5 p-2 font-mono text-[11px] dark:bg-white/5">
            {JSON.stringify([result.task], null, 2)}
          </pre>
        </details>
      ) : (
        <ul className="list-inside list-disc space-y-0.5">
          {result.errors!.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
