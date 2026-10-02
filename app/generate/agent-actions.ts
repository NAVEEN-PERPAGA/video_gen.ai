"use server";

import { apiFetch, apiFetchPage, errorMessages } from "@/lib/api";
import type { Generation } from "@/app/generate/actions";

/**
 * in_progress / requires_action: the agent is working (or waiting on an image).
 * idle: it has answered and takes a follow-up. failed: see `error`.
 */
export type AgentStatus = "in_progress" | "requires_action" | "idle" | "failed";

/** Which API runs the agent: xAI's Grok (our default) or OpenAI (the backend's default when none is sent). Fixed for a session's lifetime. */
export type AgentProvider = "openai" | "xai";

/** One entry of an agent conversation, in order. */
export type AgentTranscriptItem =
  /** `phase` "queued": a message sent while Grok was working, which goes to it with the next step. */
  | { type: "message"; role: "user" | "assistant"; phase?: string | null; text: string }
  | { type: "tool_call"; name: string; status: string }
  | { type: string; [key: string]: unknown };

/** An image the agent made: a generation, though the session may leave out fields the gallery lists. */
export type AgentGeneration = Pick<Generation, "id" | "status"> & Partial<Generation>;

/** An agent session as node_scalable returns it (.../agent-sessions/:sessionId). */
export interface AgentSession {
  id: number;
  workspaceId?: number;
  provider: AgentProvider;
  status: AgentStatus;
  generationCount: number;
  /** Only on the single-session endpoint. */
  transcript?: AgentTranscriptItem[];
  /** The images the agent made in this session. */
  generations?: AgentGeneration[];
  error?: string | null;
  createdAt?: string;
}

export type AgentState = { errors?: string[]; session?: AgentSession } | undefined;

const base = (workspaceId: number) => `/workspaces/${workspaceId}/agent-sessions`;

/** Starts the agent on `message` (the brief) with `provider`. Answers with the in-progress session; poll `getAgentSession`. */
export async function startAgentSession(
  workspaceId: number,
  message: string,
  provider: AgentProvider = "xai",
): Promise<AgentState> {
  try {
    const session = await apiFetch<AgentSession>(base(workspaceId), {
      method: "POST",
      body: JSON.stringify({ message, provider }),
    });
    return { session };
  } catch (err) {
    return { errors: errorMessages(err, "Could not start the agent.") };
  }
}

/** The session's status, conversation and generated images. */
export async function getAgentSession(workspaceId: number, sessionId: number): Promise<AgentState> {
  try {
    return { session: await apiFetch<AgentSession>(`${base(workspaceId)}/${sessionId}`) };
  } catch (err) {
    return { errors: errorMessages(err, "Could not check on the agent.") };
  }
}

/**
 * Sends a follow-up (its creator or a workspace admin only). Grok sessions also take one while working: it is
 * queued for the agent's next step. Keep polling afterwards.
 */
export async function sendAgentMessage(workspaceId: number, sessionId: number, message: string): Promise<AgentState> {
  try {
    const session = await apiFetch<AgentSession>(`${base(workspaceId)}/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    return { session };
  } catch (err) {
    return { errors: errorMessages(err, "Could not send the message.") };
  }
}

/** Stops the agent's current turn. A Grok session stops once its current step finishes. */
export async function cancelAgentSession(workspaceId: number, sessionId: number): Promise<AgentState> {
  try {
    const session = await apiFetch<AgentSession>(`${base(workspaceId)}/${sessionId}/cancel`, { method: "POST" });
    return { session };
  } catch (err) {
    return { errors: errorMessages(err, "Could not stop the agent.") };
  }
}

export type AgentSessionsPage =
  | { sessions: AgentSession[]; nextCursor: number | null; error?: undefined }
  | { error: string };

/** One page of the workspace's agent sessions, newest first. */
export async function listAgentSessions(workspaceId: number, cursor: number | null = null): Promise<AgentSessionsPage> {
  try {
    const page = await apiFetchPage<AgentSession>(base(workspaceId), { limit: 20, cursor });
    return { sessions: page.items, nextCursor: page.nextCursor as number | null };
  } catch (err) {
    return { error: errorMessages(err, "Could not load the agent sessions.").join(" ") };
  }
}
