/**
 * API Client — Typed fetch wrapper with JWT auth.
 *
 * All API calls go through this layer so auth headers,
 * error handling, and response parsing are consistent.
 */

const API_BASE = "/api";

let getToken: (() => string | null) | null = null;

/** Called once by AuthProvider to wire the token getter. */
export function setTokenGetter(fn: () => string | null) {
  getToken = fn;
}

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: ApiError,
  ) {
    super(error.message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken?.();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type for JSON bodies (not for raw audio uploads)
  if (options.body && !(options.body instanceof ArrayBuffer) && !(options.body instanceof Blob)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({
      error: { code: String(response.status), message: response.statusText },
    }));
    throw new ApiRequestError(response.status, body.error);
  }

  return response.json() as Promise<T>;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function postRaw<T>(
  path: string,
  body: ArrayBuffer | Blob,
  contentType: string,
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body,
    headers: { "Content-Type": contentType },
  });
}
