"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@/app/generate/icons";
import { modelsByOrganisation, organisationLogos, type VideoModel } from "@/lib/runware/models";
import { useDismiss } from "@/lib/use-dismiss";

export function OrgLogo({ organisation, className = "size-5" }: { organisation: string; className?: string }) {
  const logo = organisationLogos[organisation];
  const tile = logo?.tile === "dark" ? "bg-zinc-900 ring-white/10" : "bg-white ring-black/10";
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-md p-[3px] ring-1 ${tile} ${className}`}>
      {logo ? (
        <Image
          src={logo.src}
          alt=""
          className={`size-full object-contain ${logo.invert ? "invert" : ""}`}
        />
      ) : (
        <span className="text-[10px] font-semibold text-zinc-700">{organisation[0]}</span>
      )}
    </span>
  );
}

const CAPABILITY_LABELS: Record<string, string> = {
  "text-to-video": "Text",
  "image-to-video": "Image",
  "video-to-video": "Video",
  "audio-to-video": "Audio",
  edit: "Edit",
  extend: "Extend",
};

export function ModelPicker({ model, onChange }: { model: VideoModel; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useDismiss(rootRef, open, useCallback(() => setOpen(false), []));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] pr-2.5 pl-1.5 text-sm font-medium transition hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
      >
        <OrgLogo organisation={model.organisation} className="size-6 rounded-full" />
        <span className="max-w-40 truncate">{model.name}</span>
        <ChevronDownIcon className={`size-4 text-zinc-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Video model"
          className="scroll-inset absolute bottom-full left-0 z-30 mb-2 max-h-[min(28rem,70vh)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-black/10 bg-background/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10"
        >
          {modelsByOrganisation().map(([organisation, models]) => (
            <div key={organisation} className="py-1">
              <div className="flex items-center gap-2 px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
                <OrgLogo organisation={organisation} className="size-4 rounded" />
                {organisation}
              </div>
              {models.map((m) => {
                const selected = m.value === model.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    title={m.description}
                    onClick={() => {
                      onChange(m.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                      selected ? "bg-violet-500/10" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{m.name}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {m.capabilities.map((c) => (
                          <span
                            key={c}
                            className="rounded-full bg-black/[0.05] px-1.5 py-px text-[10px] text-zinc-600 dark:bg-white/[0.08] dark:text-zinc-400"
                          >
                            {CAPABILITY_LABELS[c] ?? c}
                          </span>
                        ))}
                      </span>
                    </span>
                    {selected && <CheckIcon className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
