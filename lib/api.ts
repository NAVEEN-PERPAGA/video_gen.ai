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

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");

  const res = await fetch(`${process.env.API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      ...init.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });
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
