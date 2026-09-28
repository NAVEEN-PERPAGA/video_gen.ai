"use client";

import {
  type ComponentType,
  type ReactNode,
  type SVGProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { signInWithGoogle } from "@/app/auth/actions";
import { type GenerateState, type Generation, generateVideo, getGeneration } from "@/app/generate/actions";
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
  FilmIcon,
  GaugeIcon,
  InfoIcon,
  LayersIcon,
  MediaIcon,
  MicIcon,
  MusicIcon,
  PencilIcon,
  PlusIcon,
  SlidersIcon,
  SparklesIcon,
  UploadIcon,
  XIcon,
} from "@/app/generate/icons";
import { ModelPicker } from "@/app/generate/model-picker";
import { deleteUpload, uploadVideo } from "@/app/generate/upload-video";
import { defaultModelId, getVideoModel, type FieldSchema, type VideoModel } from "@/lib/runware/models";
import {
  type AssetItem,
  type AssetKind,
  assetKinds,
  assetLimit,
  autoAdjust,
  checkValues,
  choices,
  type ComposerValues,
  fpsOptions,
  humanize,
  initialValues,
  isUploading,
  MAX_FILE_BYTES,
  type MediaKind,
  numberOptions,
  sizeOptions,
  VIDEO_UPLOAD_TYPES,
} from "@/lib/runware/request";
import { type CostEstimate, estimateCost, formatCost } from "@/lib/runware/pricing";
import { useDismiss } from "@/lib/use-dismiss";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

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
  "relative flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold transition duration-150 active:scale-[0.96]";
const pillIdle = "text-slate-200 hover:bg-white/[0.07] hover:text-white";
const pillActive = "bg-indigo-500/20 text-indigo-200 ring-1 ring-inset ring-indigo-400/40 hover:bg-indigo-500/30";
const fieldInput =
  "w-full rounded-xl border border-white/10 bg-[#262b40] px-2.5 py-1.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/25";

function newId() {
  return Math.random().toString(36).slice(2);
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function mediaOfFile(file: File): MediaKind {
  const type = file.type.split("/")[0];
  return type === "image" || type === "video" || type === "audio" ? type : "document";
}

/**
 * Reads local files into attachments. With no `target`, each file goes to the
 * first kind of its media type with room — frame images before references,
 * since a dropped picture is most often the opening shot.
 * Images and documents are read inline. Videos are returned in `uploads` to
 * be sent to workspace storage; their items wait with `progress: 0`.
 */
async function readFiles(
  files: File[],
  kinds: AssetKind[],
  assets: ComposerValues["assets"],
  canUpload: boolean,
  target?: AssetKind,
): Promise<{ assets: ComposerValues["assets"]; problems: string[]; uploads: { id: string; file: File }[] }> {
  const next = { ...assets };
  const problems: string[] = [];
  const uploads: { id: string; file: File }[] = [];
  const room = (k: AssetKind) => (next[k.key]?.length ?? 0) < k.max;
  for (const file of files) {
    const media = mediaOfFile(file);
    const candidates = target ? [target] : kinds.filter((k) => k.accept && k.media === media);
    const kind = candidates.find((k) => k.key === "frameImages" && room(k)) ?? candidates.find(room);
    if (candidates.length === 0) {
      problems.push(
        media === "audio"
          ? `${file.name}: audio files can't be uploaded yet — attach them by URL.`
          : `${file.name}: this model doesn't take ${media}s.`,
      );
    } else if (!kind) {
      problems.push(`${file.name}: no room left (${candidates.map(assetLimit).join(", ")} max).`);
    } else if (kind.media === "video") {
      if (!canUpload) {
        problems.push(`${file.name}: sign in and pick a workspace to upload videos.`);
      } else if (!VIDEO_UPLOAD_TYPES.includes(file.type)) {
        problems.push(`${file.name}: unsupported video format. Use MP4, MOV, WebM, MKV, AVI, MPEG, OGG or 3GP.`);
      } else {
        const item: AssetItem = { id: newId(), value: "", name: file.name, preview: URL.createObjectURL(file), progress: 0 };
        next[kind.key] = [...(next[kind.key] ?? []), item];
        uploads.push({ id: item.id, file });
      }
    } else if (file.size > MAX_FILE_BYTES) {
      problems.push(`${file.name} is over ${MAX_FILE_BYTES / 1024 / 1024} MB — attach it by URL instead.`);
    } else {
      const item: AssetItem = { id: newId(), value: await readDataUrl(file), name: file.name };
      next[kind.key] = [...(next[kind.key] ?? []), item];
    }
  }
  return { assets: next, problems, uploads };
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

/** How often a processing generation is re-checked (the API asks Runware at most every 5s). */
export const POLL_INTERVAL_MS = 5000;

/** How a tool page opens the composer: its model, prompt hint and settings (e.g. Seedance's "extend"). */
export interface ComposerPreset {
  modelId?: string;
  placeholder?: string;
  settings?: ComposerValues["settings"];
}

function presetValues(model: VideoModel, preset?: ComposerPreset): ComposerValues {
  const values = initialValues(model);
  return { ...values, settings: { ...values.settings, ...preset?.settings } };
}

/**
 * `workspaceId` is where generations are created; null when the user has none yet.
 * Signed-out visitors can try every control; generating sends them to sign in.
 * `onGeneration` hears about each generation this starts, and each status it polls.
 */
export function VideoComposer({
  workspaceId,
  signedIn,
  onGeneration,
  preset,
}: {
  workspaceId: number | null;
  signedIn: boolean;
  onGeneration?: (generation: Generation) => void;
  preset?: ComposerPreset;
}) {
  const [modelId, setModelId] = useState(() =>
    preset?.modelId && getVideoModel(preset.modelId) ? preset.modelId : defaultModelId,
  );
  const model = getVideoModel(modelId)!;
  const [values, setValues] = useState<ComposerValues>(() => presetValues(model, preset));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<GenerateState>();
  const [pending, startTransition] = useTransition();
  /** Why the last dropped/picked files were turned away. */
  const [notice, setNotice] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const errors = useMemo(() => checkValues(model, values), [model, values]);
  const cost = useMemo(() => estimateCost(model, values), [model, values]);
  const input = model.input;
  const kinds = assetKinds(model);
  const promptMax = input.positivePrompt?.maxLength;
  const blockedReason = signedIn && workspaceId === null ? "Create a workspace to generate videos." : errors[0];

  // Follow a processing generation until the API reports it finished.
  const processing = result?.generation?.status === "processing" ? result.generation : undefined;
  useEffect(() => {
    if (!processing) return;
    const timer = setTimeout(async () => {
      const next = await getGeneration(processing.workspaceId, processing.id);
      if (next?.generation) onGeneration?.(next.generation);
      // Ignore a late answer for a generation the user has since replaced or dismissed.
      setResult((current) => (current?.generation?.id === processing.id ? next : current));
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [processing, onGeneration]);

  const update = (patch: Partial<ComposerValues>) => setValues((v) => ({ ...v, ...patch }));
  const setSetting = (key: string, value: boolean | string | number | undefined) =>
    setValues((v) => ({ ...v, settings: { ...v.settings, [key]: value } }));
  // Attachments change which sizes/durations are valid, so re-fit those.
  const setAssets = (assets: ComposerValues["assets"]) => {
    setNotice([]);
    setValues((v) => autoAdjust(model, { ...v, assets }));
  };

  // Video uploads in flight, by attachment id, so removing one (or leaving) cancels it.
  const uploads = useRef(new Map<string, AbortController>());
  // Uploads already sent with a generation; the task may still need them, so removing one keeps the file.
  const submittedUploads = useRef(new Set<number>());
  // Upload callbacks outlive renders; they re-fit sizes for the model selected by then.
  const modelIdRef = useRef(modelId);
  useEffect(() => {
    modelIdRef.current = modelId;
  }, [modelId]);
  useEffect(() => {
    const inFlight = uploads.current;
    return () => inFlight.forEach((controller) => controller.abort());
  }, []);

  /** Updates one attachment wherever it is (it may have moved kinds on a model switch). */
  const patchAsset = useCallback((id: string, patch: Partial<AssetItem>, refit = false) => {
    setValues((v) => {
      const assets = Object.fromEntries(
        Object.entries(v.assets).map(([key, items]) => [key, items.map((i) => (i.id === id ? { ...i, ...patch } : i))]),
      );
      const next = { ...v, assets };
      return refit ? autoAdjust(getVideoModel(modelIdRef.current)!, next) : next;
    });
  }, []);

  function startUpload(id: string, file: File) {
    if (workspaceId === null) return;
    const controller = new AbortController();
    uploads.current.set(id, controller);
    let uploadId: number | undefined;
    let shown = 0;
    uploadVideo(workspaceId, file, {
      signal: controller.signal,
      onCreated: (created) => (uploadId = created),
      onProgress: (share) => {
        // Re-render in 2% steps, not on every progress event.
        const step = Math.floor(share * 50) / 50;
        if (step > shown) patchAsset(id, { progress: (shown = step) });
      },
    })
      .then((upload) => {
        // Removed while the API was confirming it: nothing will use the file.
        if (controller.signal.aborted) return deleteUpload(workspaceId, upload.id);
        // Now a real input: the size and duration may need re-fitting.
        patchAsset(id, { value: upload.url ?? "", uploadId: upload.id, progress: undefined }, true);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          if (uploadId !== undefined) deleteUpload(workspaceId, uploadId);
          // Normally the item is already gone; if it's still shown (e.g. after a
          // hot reload), say so rather than leaving it spinning.
          patchAsset(id, { uploadError: "The upload was cancelled." });
          return;
        }
        console.error("Video upload failed:", err);
        patchAsset(id, { uploadError: err instanceof Error ? err.message : "The upload failed." });
      })
      .finally(() => uploads.current.delete(id));
  }

  /** Cancels an attachment's upload, or deletes its stored file if no generation used it. */
  function discardAsset(item: AssetItem) {
    uploads.current.get(item.id)?.abort();
    if (workspaceId !== null && item.uploadId !== undefined && !submittedUploads.current.has(item.uploadId)) {
      deleteUpload(workspaceId, item.uploadId);
    }
    if (item.preview) URL.revokeObjectURL(item.preview);
  }

  async function attachFiles(files: File[], target?: AssetKind) {
    if (files.length === 0) return;
    const before = values.assets;
    const { assets, problems, uploads: pending } = await readFiles(
      files,
      kinds,
      before,
      signedIn && workspaceId !== null,
      target,
    );
    // Append only what was added: uploads may have updated other items meanwhile.
    setValues((v) => {
      const merged = { ...v.assets };
      for (const [key, items] of Object.entries(assets)) {
        const added = items.slice(before[key]?.length ?? 0);
        if (added.length > 0) merged[key] = [...(merged[key] ?? []), ...added];
      }
      return autoAdjust(model, { ...v, assets: merged });
    });
    setNotice(problems);
    for (const { id, file } of pending) startUpload(id, file);
  }

  function selectModel(id: string) {
    const next = getVideoModel(id)!;
    setModelId(id);
    setValues((v) => carryOver(next, v));
    // Errors were about the old model; a generation in progress stays visible.
    setResult((r) => (r?.generation ? r : undefined));
    setNotice([]);
  }

  function submit() {
    if (pending || blockedReason) return;
    if (!signedIn) {
      // Come back to this tool page after signing in.
      const form = new FormData();
      form.set("next", window.location.pathname);
      startTransition(() => signInWithGoogle(form));
      return;
    }
    if (workspaceId === null) return;
    for (const items of Object.values(values.assets)) {
      for (const item of items) if (item.uploadId !== undefined) submittedUploads.current.add(item.uploadId);
    }
    startTransition(async () => {
      const state = await generateVideo(workspaceId, model.value, values);
      setResult(state);
      if (state?.generation) onGeneration?.(state.generation);
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
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setDragging(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setDragging(false);
            attachFiles([...e.dataTransfer.files]);
          }}
          className={`pointer-events-auto relative mx-auto w-full max-w-3xl rounded-[28px] border bg-[#1b1f33] p-3 text-slate-100 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.75)] transition ${dragging ? "border-indigo-400/60 ring-4 ring-indigo-500/20" : "border-white/[0.06]"}`}
        >
          {dragging && <DropOverlay kinds={kinds} />}
          <div className="flex flex-col gap-2.5">
            {/* A processing generation shows as a spinner card in the gallery instead. */}
            {result && !processing && <ResultBanner result={result} onClose={() => setResult(undefined)} />}

            {showAdvanced && (
              <AdvancedPanel
                model={model}
                values={values}
                update={update}
                numericSettings={numericSettings}
                setSetting={setSetting}
              />
            )}

            <AssetTray kinds={kinds} values={values} setAssets={setAssets} onRemove={discardAsset} />

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
              onPaste={(e) => {
                const files = [...e.clipboardData.files];
                if (files.length === 0) return;
                e.preventDefault();
                attachFiles(files);
              }}
              rows={2}
              maxLength={promptMax}
              placeholder={preset?.placeholder ?? "Describe the shot: subject, motion, camera, lighting, mood…"}
              aria-label="Prompt"
              className="max-h-56 min-h-16 resize-none rounded-2xl bg-[#262b40] px-4 py-3 text-[15px] leading-relaxed text-slate-100 ring-1 ring-transparent outline-none transition field-sizing-content placeholder:text-slate-400 hover:bg-[#2b3048] focus:ring-indigo-400/50"
            />

            <div className="flex items-end gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <ModelPicker model={model} onChange={selectModel} />
                {kinds.length > 0 && (
                  <AttachMenu
                    model={model}
                    kinds={kinds}
                    values={values}
                    setAssets={setAssets}
                    attachFiles={attachFiles}
                  />
                )}

                <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden="true" />

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
                disabled={pending || Boolean(blockedReason)}
                aria-label="Generate video"
                title={blockedReason ?? (signedIn ? "Generate (Enter)" : "Sign in with Google to generate")}
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 transition duration-150 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-500/40 active:translate-y-0 active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-slate-500 disabled:shadow-none"
              >
                {pending ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <ArrowUpIcon className="size-5" />
                )}
              </button>
            </div>

            <StatusLine errors={errors} notice={notice} mode={modeLabel(model, values)} length={values.prompt.trim().length} max={promptMax} />
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
          <IconCmp className="size-4 text-indigo-300" />
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
          <ChevronDownIcon className="size-4 shrink-0 text-slate-400" />
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
      <IconCmp className="size-4 text-indigo-300" />
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
        <span className="flex h-9 items-center gap-1 rounded-xl bg-[#262b40] px-2 text-[13px] text-slate-100">
          {(["customWidth", "customHeight"] as const).map((key, i) => (
            <span key={key} className="flex items-center gap-1">
              {i === 1 && <span className="text-slate-500">×</span>}
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
      className={`absolute bottom-full left-0 z-30 mb-2 flex max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-2xl border border-white/10 bg-[#1b1f33]/95 p-3 text-slate-100 shadow-2xl backdrop-blur-xl ${className}`}
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
        <MicIcon className="size-4 text-indigo-300" />
        {selected.length ? selected.map(humanize).join(", ") : "Voices"}
      </button>
      {open && (
        <Popover className="w-80">
          <div className="text-xs">
            <p className="font-medium">Speech voices · up to {max}</p>
            <p className="mt-0.5 text-slate-400">
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
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-white/10 ring-inset transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${on ? pillActive : pillIdle}`}
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
  model,
  kinds,
  values,
  setAssets,
  attachFiles,
}: {
  model: VideoModel;
  kinds: AssetKind[];
  values: ComposerValues;
  setAssets: (assets: ComposerValues["assets"]) => void;
  attachFiles: (files: File[], target?: AssetKind) => Promise<void>;
}) {
  const { open, setOpen, ref } = usePopover();
  const [kind, setKind] = useState<AssetKind | null>(null);
  const [draft, setDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const remaining = kind ? kind.max - (values.assets[kind.key]?.length ?? 0) : 0;

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
        title={`Add media · ${kinds.map(assetLimit).join(", ")}`}
        className={`${pillBase} w-9 justify-center px-0 ${open ? pillActive : pillIdle}`}
      >
        <PlusIcon className={`size-4 transition ${open ? "rotate-45" : ""}`} />
      </button>

      {open && (
        <Popover>
          {kind ? (
            <>
              <p className="flex items-center gap-1.5 text-xs font-medium">
                <MediaIcon media={kind.media} className="size-4 text-indigo-300" />
                {kind.label}
                <span className="ml-auto font-normal tabular-nums text-slate-400">{remaining} left</span>
              </p>
              {kind.accept && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    accept={kind.accept}
                    multiple={remaining > 1}
                    onChange={(e) => {
                      const files = [...(e.target.files ?? [])].slice(0, remaining);
                      e.target.value = "";
                      attachFiles(files, kind).then(close);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-white/15 px-3 py-4 text-xs text-slate-300 transition hover:border-indigo-400/50 hover:bg-indigo-500/10 hover:text-white active:scale-[0.98]"
                  >
                    <UploadIcon className="size-5 text-indigo-300" />
                    <span className="font-medium">Upload from device</span>
                    <span className="text-[11px] text-slate-500">
                      {kind.media === "video"
                        ? "MP4, MOV, WebM and more · saved to this workspace"
                        : `Up to ${MAX_FILE_BYTES / 1024 / 1024} MB each`}{" "}
                      · or drop / paste into the prompt
                    </span>
                  </button>
                  <p className="flex items-center gap-2 text-[11px] text-slate-500 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
                    or link
                  </p>
                </>
              )}
              <input
                autoFocus={!kind.accept}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    attach();
                  }
                }}
                aria-label={`${kind.label} link`}
                placeholder={
                  kind.media === "text"
                    ? "Draft cache id"
                    : kind.media === "link"
                      ? "https://…"
                      : "https://… or Runware UUID"
                }
                className={fieldInput}
              />
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setKind(null)}
                  className="cursor-pointer rounded-lg px-2.5 py-1 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={attach}
                  disabled={!draft.trim()}
                  className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-indigo-600"
                >
                  Attach
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-slate-400">{model.name} accepts</p>
              <ul className="-mx-1.5 -mb-1.5 flex flex-col">
                {kinds.map((k) => {
                  const count = values.assets[k.key]?.length ?? 0;
                  const full = count >= k.max;
                  return (
                    <li key={k.key}>
                      <button
                        type="button"
                        disabled={full}
                        onClick={() => setKind(k)}
                        className="group/item flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300 transition group-hover/item:bg-indigo-500/25">
                          <MediaIcon media={k.media} className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{k.label}</span>
                          <span className="block text-[11px] text-slate-500">
                            Up to {k.max} · {k.accept ? "upload or link" : "link only"}
                          </span>
                        </span>
                        <span className="text-xs tabular-nums text-slate-400">
                          {count}/{k.max}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Popover>
      )}
    </div>
  );
}

/** Shown over the composer while files are dragged onto it. */
function DropOverlay({ kinds }: { kinds: AssetKind[] }) {
  const uploadable = kinds.filter((k) => k.accept);
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 rounded-[28px] bg-[#1b1f33]/90 text-center backdrop-blur-sm">
      <UploadIcon className="size-6 text-indigo-300" />
      <p className="text-sm font-semibold">
        {uploadable.length > 0 ? "Drop to attach" : "This model takes media by link only"}
      </p>
      {uploadable.length > 0 && (
        <p className="px-6 text-xs text-slate-400">{uploadable.map(assetLimit).join(" · ")}</p>
      )}
    </div>
  );
}

function AssetTray({
  kinds,
  values,
  setAssets,
  onRemove,
}: {
  kinds: AssetKind[];
  values: ComposerValues;
  setAssets: (assets: ComposerValues["assets"]) => void;
  /** Cleans up after an attachment is taken out (cancels or deletes its upload). */
  onRemove: (item: AssetItem) => void;
}) {
  const entries = kinds.flatMap((kind) => (values.assets[kind.key] ?? []).map((item) => ({ kind, item })));
  if (entries.length === 0) return null;

  const change = (kind: AssetKind, id: string, patch: { frame?: string } | null) => {
    const items = values.assets[kind.key] ?? [];
    if (patch === null) {
      const removed = items.find((i) => i.id === id);
      if (removed) onRemove(removed);
    }
    const next = patch === null ? items.filter((i) => i.id !== id) : items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setAssets({ ...values.assets, [kind.key]: next });
  };

  return (
    <ul className="flex gap-2 overflow-x-auto px-1 pt-1 pb-0.5">
      {entries.map(({ kind, item }) => (
        <li key={item.id} className="group relative flex w-20 shrink-0 flex-col gap-1">
          <div className="relative size-20 overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
            {kind.media === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied URL
              <img src={item.value} alt="" className="size-full object-cover" />
            ) : kind.media === "video" ? (
              <video src={item.preview ?? item.value} muted playsInline preload="metadata" className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 p-1.5 text-slate-400">
                <MediaIcon media={kind.media} className="size-5" />
                <span className="w-full truncate text-center text-[10px]" title={item.name ?? item.value}>
                  {item.name ?? item.value}
                </span>
              </div>
            )}
            {isUploading(item) && <UploadProgress progress={item.progress ?? 0} />}
            {item.uploadError !== undefined && (
              <div
                role="alert"
                title={item.uploadError}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-950/80 p-1.5 text-center text-[10px] font-medium text-red-200"
              >
                <AlertIcon className="size-4" />
                Upload failed
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
              className="flex w-full cursor-pointer items-center justify-center gap-0.5 rounded-md py-0.5 text-[11px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              {(current) => (
                <>
                  <span className="truncate">{current?.value ? current.label.replace(" frame", "") : "Auto"}</span>
                  <ChevronDownIcon className="size-3 shrink-0" />
                </>
              )}
            </Dropdown>
          ) : (
            <span className="truncate text-center text-[11px] font-medium text-slate-400">
              {kind.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** A ring filling up over a video that's uploading, with the percentage. */
function UploadProgress({ progress }: { progress: number }) {
  const percent = Math.round(progress * 100);
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      role="progressbar"
      aria-label="Uploading video"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="absolute inset-0 flex items-center justify-center bg-black/55"
    >
      <svg viewBox="0 0 36 36" className="size-11 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="3" className="stroke-white/20" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="stroke-indigo-400 transition-[stroke-dashoffset] duration-200"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-white tabular-nums">{percent}%</span>
    </div>
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
    <div className="scroll-inset max-h-[45vh] overflow-y-auto rounded-2xl bg-white/[0.04] p-3">
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
                className="flex w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/[0.07] hover:text-white active:scale-95"
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
                className="h-8 w-full cursor-pointer accent-indigo-500"
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
              className="h-8 w-full cursor-pointer accent-indigo-500"
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
                  className="accent-indigo-500"
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
          <summary className="flex cursor-pointer items-center gap-1.5 font-medium text-slate-400 transition hover:text-white">
            <InfoIcon className="size-3.5" />
            {model.name} rules
          </summary>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
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
              className="shrink-0 cursor-pointer rounded-lg px-1 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set([...values.lora, { model: "", weight: (weight?.default as number) ?? 1 }])}
          className="flex cursor-pointer items-center gap-1 self-start rounded-lg px-1.5 py-1 font-medium text-indigo-300 transition hover:bg-indigo-500/15 hover:text-indigo-200"
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
        {value !== undefined && <span className="tabular-nums text-slate-400">{value}</span>}
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
  // The badge shows just the amount; the tooltip keeps the "~" and the full breakdown.
  const amount = value === undefined ? "—" : `${formatCost(value)}${cost.total === undefined ? "/s" : ""}`;

  return (
    <div className={`group relative mb-0.5 shrink-0 transition-opacity ${invalid ? "opacity-45" : ""}`}>
      <button
        type="button"
        aria-describedby="cost-details"
        aria-label={`Estimated cost ${label}`}
        className="flex h-9 items-center rounded-xl px-1.5 text-sm font-semibold tabular-nums text-amber-300 outline-none transition hover:text-amber-200 focus-visible:ring-2 focus-visible:ring-amber-400/50"
      >
        {amount}
      </button>

      <div
        id="cost-details"
        role="tooltip"
        className="pointer-events-none invisible absolute right-0 bottom-full z-30 mb-2 w-64 translate-y-1 rounded-2xl border border-white/10 bg-[#1b1f33]/95 p-3 text-xs text-slate-200 opacity-0 shadow-2xl backdrop-blur-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
      >
        <p className="flex items-baseline justify-between gap-2 font-medium">
          <span>Estimated cost</span>
          <span className="tabular-nums">{label}</span>
        </p>
        {cost.breakdown.length > 0 && <p className="mt-1 text-slate-400">{cost.breakdown.join(" × ")}</p>}
        {cost.promo && (
          <p className="mt-2 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-300">
            {cost.promo}
          </p>
        )}
        {cost.notes.length > 0 && (
          <ul className="mt-2 space-y-1 text-slate-400">
            {cost.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 border-t border-white/10 pt-2 text-[11px] text-slate-400">
          Based on Runware&apos;s published rates for {model.name} (checked {model.pricing?.checked}). Runware
          sets the final cost.
        </p>
      </div>
    </div>
  );
}

function StatusLine({
  errors,
  notice,
  mode,
  length,
  max,
}: {
  errors: string[];
  notice: string[];
  mode: string;
  length: number;
  max?: number;
}) {
  // An empty prompt is the starting state, not something to warn about.
  const shown = [...notice, ...(length === 0 ? errors.filter((e) => e !== "Enter a prompt.") : errors)];
  return (
    <div className="flex items-center gap-2 px-2.5 pb-0.5 text-[11px]">
      {shown.length > 0 ? (
        <span className="flex min-w-0 items-center gap-1.5 text-amber-400" title={shown.join("\n")}>
          <AlertIcon className="size-3.5 shrink-0" />
          <span className="truncate">{shown[0]}</span>
          {shown.length > 1 && <span className="shrink-0 opacity-70">+{shown.length - 1} more</span>}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className={`size-1.5 rounded-full ${errors.length === 0 ? "bg-emerald-400" : "bg-slate-500"}`} />
          {mode}
        </span>
      )}
      <span className="ml-auto shrink-0 tabular-nums text-slate-500">
        {length}
        {max ? ` / ${max}` : ""}
      </span>
    </div>
  );
}

function ResultBanner({ result, onClose }: { result: NonNullable<GenerateState>; onClose: () => void }) {
  const generation = result.errors ? undefined : result.generation;
  const failed = !generation || generation.status === "failed";
  return (
    <div
      role={failed ? "alert" : "status"}
      className={`relative rounded-2xl border p-3 pr-9 text-xs ${
        failed
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      }`}
    >
      <button type="button" aria-label="Dismiss" onClick={onClose} className="absolute top-2.5 right-2.5 cursor-pointer rounded-md opacity-70 transition hover:bg-white/10 hover:opacity-100">
        <XIcon className="size-4" />
      </button>
      {!generation ? (
        <ul className="list-inside list-disc space-y-0.5">
          {result.errors?.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 font-medium">
            {generation.status === "completed" ? <CheckIcon className="size-4" /> : <AlertIcon className="size-4" />}
            {generation.status === "completed" ? "Video ready" : "Generation failed"}
            {generation.cost !== null && <span className="font-normal opacity-70">· ${generation.cost.toFixed(4)}</span>}
          </p>
          {/* Set when the task failed, or when only some of several results succeeded. */}
          {generation.error && <p>{generation.error}</p>}
          {generation.videoUrls.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {generation.videoUrls.map((url) => (
                <video key={url} src={url} controls playsInline className="max-h-72 w-full rounded-lg bg-black" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
