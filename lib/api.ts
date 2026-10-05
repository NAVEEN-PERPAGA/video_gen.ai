import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Calls the node_scalable API (/api/v1/...) as the signed-in user, sending
 * the Supabase access token as a Bearer token. The API verifies it itself.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const body = await apiRequest<{ data: T }>(path, init);
  return body.data;
}

/** Sends a request whose success response has no body (204), e.g. a DELETE. */
export async function apiSend(path: string, init: RequestInit): Promise<void> {
  await apiRequest<void>(path, init);
}

export type Cursor = string | number | null;

/**
 * Fetches one page of a cursor-paginated list endpoint
 * (`{ data: T[], meta: { nextCursor } }`). `nextCursor` is null on the last page.
 */
export async function apiFetchPage<T>(
  path: string,
  { limit, cursor = null }: { limit: number; cursor?: Cursor },
): Promise<{ items: T[]; nextCursor: Cursor }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor !== null) params.set("cursor", String(cursor));
  const page = await apiRequest<{ data: T[]; meta: { nextCursor: Cursor } }>(`${path}?${params}`);
  return { items: page.data, nextCursor: page.meta.nextCursor };
}

/** Fetches every page of a cursor-paginated list endpoint and returns all items. */
export async function apiFetchAll<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let cursor: Cursor = null;
  do {
    const page: { items: T[]; nextCursor: Cursor } = await apiFetchPage<T>(path, { limit: 100, cursor });
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor !== null);
  return items;
}

/**
 * Forwards a request to the API as the signed-in user and hands back the
 * API's answer unchanged (status and JSON body), for Route Handlers that
 * expose an API endpoint to the browser. Answers 401 when signed out and
 * 502 when the API can't be reached, in the API's own error shape.
 */
export async function apiProxy(path: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await backendFetch(path, init);
  } catch (err) {
    const signedOut = err instanceof ApiError && err.status === 401;
    if (!signedOut) console.error(`API request failed: ${init.method ?? "GET"} ${path}`, err);
    return Response.json(
      signedOut
        ? { error: { code: "UNAUTHORIZED", message: "Sign in to continue." } }
        : { error: { code: "API_UNREACHABLE", message: "The API server is unreachable." } },
      { status: signedOut ? 401 : 502 },
    );
  }
  // 204 and friends have no body to pass on.
  if (res.status === 204) return new Response(null, { status: 204 });
  return new Response(res.body, { status: res.status, headers: { "Content-Type": "application/json" } });
}

/** A fetch to `${API_URL}/api/v1${path}` with the user's access token. Throws a 401 ApiError when signed out. */
async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new ApiError(401, "Not signed in");

  return fetch(`${process.env.API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      ...init.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await backendFetch(path, init);
  if (!res.ok) {
    // The API answers errors as { error: { code, message, ... } }.
    const body = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string; details?: unknown };
    } | null;
    throw new ApiError(
      res.status,
      body?.error?.message ?? `Request failed with status ${res.status}`,
      body?.error?.code,
      body?.error?.details,
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
    /** e.g. { "/duration": ["must be <= 10"] } for VALIDATION_ERROR. */
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The API's message plus any per-field (VALIDATION_ERROR) or provider (PROVIDER_REJECTED) details. */
export function errorMessages(err: unknown, fallback: string): string[] {
  if (!(err instanceof ApiError)) {
    console.error(fallback, err);
    // fetch() rejects with a TypeError when the API can't be reached at all.
    return [err instanceof TypeError ? `${fallback} The API server is unreachable.` : fallback];
  }
  const { details } = err;
  const lines: string[] = [];
  if (Array.isArray(details)) {
    for (const d of details as { message?: string; code?: string }[]) {
      const line = d?.message ?? d?.code;
      if (line) lines.push(line);
    }
  } else if (details && typeof details === "object") {
    for (const [path, messages] of Object.entries(details as Record<string, unknown>)) {
      const field = path.replace(/^\//, "").replace(/\//g, ".") || "request";
      for (const m of Array.isArray(messages) ? messages : [messages]) lines.push(`${field}: ${String(m)}`);
    }
  }
  return lines.length > 0 ? lines : [err.message];
}
