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

/**
 * Fetches every page of a cursor-paginated list endpoint
 * (`{ data: T[], meta: { nextCursor } }`) and returns all items.
 */
export async function apiFetchAll<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | number | null = null;
  do {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor !== null) params.set("cursor", String(cursor));
    const page: { data: T[]; meta: { nextCursor: string | number | null } } =
      await apiRequest(`${path}?${params}`);
    items.push(...page.data);
    cursor = page.meta.nextCursor;
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
      error?: { code?: string; message?: string };
    } | null;
    throw new ApiError(
      res.status,
      body?.error?.message ?? `Request failed with status ${res.status}`,
      body?.error?.code,
    );
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
