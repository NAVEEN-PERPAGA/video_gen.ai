"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Generation } from "@/app/generate/actions";
import {
  type AgentGeneration,
  type AgentProvider,
  type AgentSession,
  type AgentTranscriptItem,
  cancelAgentSession,
  getAgentSession,
  sendAgentMessage,
  startAgentSession,
} from "@/app/generate/agent-actions";
import { AlertIcon, CheckIcon, PlusIcon, SparklesIcon } from "@/app/generate/icons";

/** How often a working agent session is re-checked. */
const AGENT_POLL_MS = 3000;

function isBusy(session: AgentSession | null) {
  return session?.status === "in_progress" || session?.status === "requires_action";
}

/** Agent generations as full gallery entries, in case the session omits fields the gallery reads. */
function asGeneration(g: AgentGeneration): Generation {
  return {
    workspaceId: 0,
    mediaType: "image",
    model: null,
    videoUrls: [],
    imageUrls: [],
    videoMetadata: {},
    error: null,
    cost: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    ...g,
  };
}

/** The agent's providers, as the composer offers them (kept here: a "use server" file exports only functions). */
export const AGENT_PROVIDERS: { id: AgentProvider; label: string }[] = [
  { id: "xai", label: "Grok" },
  { id: "openai", label: "GPT" },
];

export function providerLabel(provider: AgentProvider | undefined) {
  return AGENT_PROVIDERS.find((p) => p.id === provider)?.label ?? provider;
}

/**
 * The composer's agent conversation in `workspaceId`: the first message starts
 * a session with the chosen `provider`, later ones follow up in it. Polls while
 * the agent works and reports each image it makes to `onGeneration`, so the
 * gallery shows them.
 */
export function useAgentSession(workspaceId: number | null, onGeneration?: (generation: Generation) => void) {
  const [session, setSession] = useState<AgentSession | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  /** The provider the next new conversation starts with; a session keeps the one it started with. */
  const [provider, setProvider] = useState<AgentProvider>("xai");
  /** Bumped after every poll, so a failed poll (which leaves the session as it was) still schedules the next. */
  const [polls, setPolls] = useState(0);
  const busy = isBusy(session);
  /** Grok queues a message sent mid-turn for its next step, so its sessions take follow-ups while busy. */
  const canQueue = busy && session?.provider === "xai";

  const report = useCallback(
    (s: AgentSession) => {
      for (const g of s.generations ?? []) onGeneration?.(asGeneration(g));
    },
    [onGeneration],
  );

  const sessionId = session?.id;
  useEffect(() => {
    if (!busy || workspaceId === null || sessionId === undefined) return;
    const timer = setTimeout(async () => {
      const next = await getAgentSession(workspaceId, sessionId);
      if (next?.session) report(next.session);
      // Ignore a late answer for a conversation the user has since left.
      setSession((current) => (current?.id === sessionId && next?.session ? next.session : current));
      setErrors(next?.errors ?? []);
      setPolls((n) => n + 1);
    }, AGENT_POLL_MS);
    return () => clearTimeout(timer);
  }, [busy, workspaceId, sessionId, polls, report]);

  /** Sends `text`, starting a session if there is none (or the last one failed). Resolves true when sent. */
  async function send(text: string): Promise<boolean> {
    if (workspaceId === null || sending || (busy && !canQueue)) return false;
    const previous = session?.status === "failed" ? null : session;
    setSending(true);
    setErrors([]);
    const result = previous
      ? await sendAgentMessage(workspaceId, previous.id, text)
      : await startAgentSession(workspaceId, text, provider);
    setSending(false);
    if (!result?.session) {
      setErrors(result?.errors ?? ["Could not reach the agent."]);
      return false;
    }
    const s = result.session;
    report(s);
    const queued = busy && previous !== null;
    setSession({
      ...s,
      provider: s.provider ?? previous?.provider ?? provider,
      // The turn has been queued: poll until the agent answers.
      status: s.status === "idle" ? "in_progress" : s.status,
      // Show the message right away; the next poll brings the server's transcript.
      transcript: s.transcript ?? [
        ...(previous?.transcript ?? []),
        { type: "message", role: "user", phase: queued ? "queued" : null, text },
      ],
    });
    return true;
  }

  async function cancel() {
    if (workspaceId === null || !session) return;
    const result = await cancelAgentSession(workspaceId, session.id);
    if (result?.errors) setErrors(result.errors);
    if (result?.session) {
      const s = result.session;
      setSession((current) =>
        current?.id === s.id ? { ...current, ...s, transcript: s.transcript ?? current.transcript } : current,
      );
    }
  }

  function reset() {
    setSession(null);
    setErrors([]);
  }

  return { session, errors, sending, busy, canQueue, provider, setProvider, send, cancel, reset };
}

export type AgentConversation = ReturnType<typeof useAgentSession>;

/** The conversation above the prompt while Agent is on: messages, tool steps and the images made so far. */
export function AgentPanel({ agent }: { agent: AgentConversation }) {
  const { session, errors, sending, busy } = agent;
  const scrollRef = useRef<HTMLDivElement>(null);
  const transcript = session?.transcript ?? [];
  const generations = session?.generations ?? [];
  const working = sending || busy;
  const imageUrls = new Set(generations.flatMap((g) => g.imageUrls ?? []));

  // Keep the latest turn in view as the conversation grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript.length, generations.length, working]);

  if (!session && errors.length === 0 && !sending) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-white/[0.04] px-3 py-2.5 text-xs text-slate-400">
        <SparklesIcon className="size-4 shrink-0 text-indigo-300" />
        Describe what you need. The agent plans the shots, picks models and generates the images; follow up to refine
        them.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white/[0.04] p-3">
      <div className="flex items-center gap-2 text-xs">
        <SparklesIcon className="size-4 text-indigo-300" />
        <span className="font-semibold">Agent</span>
        {session && <span className="text-slate-500">· {providerLabel(session.provider)}</span>}
        <StatusChip session={session} sending={sending} />
        <span className="ml-auto flex items-center gap-1">
          {busy && (
            <button
              type="button"
              onClick={agent.cancel}
              className="cursor-pointer rounded-lg px-2 py-1 font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
            >
              Stop
            </button>
          )}
          {session && (
            <button
              type="button"
              onClick={agent.reset}
              disabled={working}
              title="Start a new conversation"
              className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlusIcon className="size-3.5" />
              New chat
            </button>
          )}
        </span>
      </div>

      <div ref={scrollRef} className="scroll-inset flex max-h-[38vh] flex-col gap-2 overflow-y-auto">
        {transcript.map((item, i) => (
          <TranscriptEntry key={i} item={item} imageUrls={imageUrls} />
        ))}

        {working && (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <span className="size-3.5 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
            {session?.status === "requires_action" ? "Waiting for an image to finish…" : "Thinking…"}
            {agent.canQueue && <span className="text-slate-500">You can still send a message; it goes with the next step.</span>}
          </p>
        )}

        {generations.length > 0 && <GenerationStrip generations={generations} />}
      </div>

      {session?.status === "failed" && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-red-300">
          <AlertIcon className="mt-px size-3.5 shrink-0" />
          <span>{session.error ?? "The agent failed."} Your next message starts a new conversation.</span>
        </p>
      )}
      {errors.length > 0 && (
        <ul role="alert" className="list-inside list-disc space-y-0.5 text-xs text-red-300">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusChip({ session, sending }: { session: AgentSession | null; sending: boolean }) {
  const status = sending ? "sending" : session?.status;
  if (!status) return null;
  const label: Record<string, string> = {
    sending: "Sending",
    in_progress: "Working",
    requires_action: "Generating",
    idle: "Ready",
    failed: "Failed",
  };
  const tone =
    status === "failed"
      ? "bg-red-500/15 text-red-300"
      : status === "idle"
        ? "bg-emerald-500/15 text-emerald-300"
        : "bg-indigo-500/15 text-indigo-200";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{label[status] ?? status}</span>;
}

const URL_RE = /https?:\/\/[^\s)\]]+/g;
const IMAGE_FILE_RE = /\.(png|jpe?g|webp|gif|avif)(\?|$)/i;

/**
 * The agent's reply without links to the images it made (the strip below shows them): markdown images go,
 * image links keep their label, and list items left with nothing but a marker are dropped.
 */
function withoutImageLinks(text: string, imageUrls: Set<string>) {
  const isImage = (url: string) => imageUrls.has(url) || IMAGE_FILE_RE.test(url);
  return text
    .split("\n")
    .flatMap((line) => {
      const stripped = line
        .replace(/!\[[^\]]*\]\((https?:[^)\s]+)[^)]*\)/g, (m, url: string) => (isImage(url) ? "" : m))
        .replace(/\[([^\]]*)\]\((https?:[^)\s]+)[^)]*\)/g, (m, label: string, url: string) => (isImage(url) ? label : m))
        .replace(URL_RE, (url) => (isImage(url) ? "" : url));
      if (stripped === line) return [line];
      // A line that was only a link ("1. https://…", "- <url>") has nothing left to say.
      return /^[\s\d.)*•:-]*$/.test(stripped) ? [] : [stripped.replace(/ {2,}/g, " ").replace(/\s+$/, "")];
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function TranscriptEntry({ item, imageUrls }: { item: AgentTranscriptItem; imageUrls: Set<string> }) {
  if (item.type === "message" && typeof item.text === "string") {
    const mine = item.role === "user";
    const text = mine ? item.text : withoutImageLinks(item.text, imageUrls);
    if (!text) return null;
    const queued = item.phase === "queued";
    return (
      <div className={`flex max-w-[85%] flex-col gap-0.5 ${mine ? "self-end items-end" : "self-start items-start"}`}>
        <p
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
            mine ? "bg-indigo-600/80 text-white" : "bg-[#262b40] text-slate-100"
          } ${queued ? "opacity-60" : ""}`}
        >
          {text}
        </p>
        {queued && <span className="text-[11px] text-slate-500">Queued for the agent&apos;s next step</span>}
      </div>
    );
  }
  if (item.type === "tool_call" && typeof item.name === "string") {
    const done = item.status === "completed";
    const failed = item.status === "failed" || item.status === "incomplete";
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        {done ? (
          <CheckIcon className="size-3.5 text-emerald-400" />
        ) : failed ? (
          <AlertIcon className="size-3.5 text-red-300" />
        ) : (
          <span className="size-3 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
        )}
        <code className="rounded bg-white/[0.06] px-1 py-px">{item.name}</code>
        <span>{String(item.status ?? "")}</span>
      </p>
    );
  }
  return null;
}

/** The session's images, newest last, uncropped at a fixed height; each opens full size in a new tab. */
function GenerationStrip({ generations }: { generations: AgentGeneration[] }) {
  return (
    <ul className="flex shrink-0 gap-2 overflow-x-auto pt-1 pb-2">
      {generations.flatMap((g) =>
        g.imageUrls?.length
          ? g.imageUrls.map((url) => (
              <li key={url} className="shrink-0">
                <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated image on Runware's CDN */}
                  <img src={url} alt="" className="block h-40 w-auto max-w-none transition hover:opacity-90" />
                </a>
              </li>
            ))
          : [
              <li
                key={g.id}
                title={g.error ?? undefined}
                className={`flex size-40 shrink-0 items-center justify-center rounded-xl text-[11px] ${
                  g.status === "failed" ? "bg-red-500/10 text-red-300" : "bg-white/[0.05] text-slate-400"
                }`}
              >
                {g.status === "failed" ? (
                  <AlertIcon className="size-5" />
                ) : (
                  <span className="size-5 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
                )}
              </li>,
            ],
      )}
    </ul>
  );
}
