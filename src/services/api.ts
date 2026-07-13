const DEFAULT_API_URL = "/api/v1";
const ACCESS_TOKEN_KEY = "agrodesk-ti-access-token-v1";
const REFRESH_TOKEN_KEY = "agrodesk-ti-refresh-token-v1";

type QueryValue = string | number | boolean | null | undefined;

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

let onSessionExpired: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

function normalizeApiBaseUrl(input?: string): string {
  const raw = (input ?? DEFAULT_API_URL).trim();
  const noSlash = raw.replace(/\/+$/, "");
  if (/\/api$/i.test(noSlash)) return `${noSlash}/v1`;
  return noSlash;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

function getStoredToken(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function setStoredToken(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (!value) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, value);
}

export function setAccessToken(token: string | null) {
  setStoredToken(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  return getStoredToken(ACCESS_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  setStoredToken(REFRESH_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return getStoredToken(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

function toQueryString(query?: Record<string, QueryValue>): string {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.append(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function resolveUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}${toQueryString(query)}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  if (contentType.includes("text/")) return response.text();
  return null;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  const normalize = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    if (/^<!doctype html/i.test(trimmed) || /^<html/i.test(trimmed)) {
      return "Erro inesperado no servidor. Tente novamente.";
    }
    return trimmed;
  };

  if (!payload) return fallback;
  if (typeof payload === "string") return normalize(payload);

  if (typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const message = data.message;
    if (typeof message === "string") return normalize(message);
    if (Array.isArray(message) && message.length > 0) {
      const first = message[0];
      if (typeof first === "string") return normalize(first);
    }
    if (typeof data.error === "string") return normalize(data.error);
  }

  return fallback;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(resolveUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearAuthTokens();
        return null;
      }

      const payload = (await parseResponseBody(response)) as {
        accessToken?: string;
        refreshToken?: string;
      } | null;

      const nextAccess = payload?.accessToken ?? null;
      const nextRefresh = payload?.refreshToken ?? refreshToken;
      setAccessToken(nextAccess);
      setRefreshToken(nextRefresh);
      return nextAccess;
    })()
      .catch(() => {
        clearAuthTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export interface ApiRequestOptions {
  body?: BodyInit | FormData | Record<string, unknown> | null;
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  skipAuth?: boolean;
}

async function request<T>(path: string, options: ApiRequestOptions = {}, retry = true): Promise<T> {
  const { body, headers, method = "GET", query, skipAuth = false } = options;
  const requestHeaders: Record<string, string> = { ...(headers ?? {}) };

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body && typeof body === "object") {
    requestHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  } else if (typeof body === "string") {
    payload = body;
  } else if (body === null) {
    payload = undefined;
  }

  const accessToken = getAccessToken();
  if (!skipAuth && accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(resolveUrl(path, query), {
    method,
    headers: requestHeaders,
    body: payload,
  });

  if (response.status === 401 && retry && !skipAuth) {
    const renewed = await refreshAccessToken();
    if (renewed) return request<T>(path, options, false);

    clearAuthTokens();
    onSessionExpired?.();
    throw new ApiError("Sessao expirada. Faca login novamente.", 401);
  }

  const parsed = await parseResponseBody(response);
  if (!response.ok) {
    const message = extractErrorMessage(parsed, "Erro na comunicacao com a API");
    throw new ApiError(message, response.status, parsed);
  }

  return parsed as T;
}

export const apiClient = {
  baseUrl: API_BASE_URL,
  clearAuthTokens,
  get: <T>(path: string, query?: Record<string, QueryValue>) =>
    request<T>(path, { method: "GET", query }),
  post: <T>(
    path: string,
    body?: ApiRequestOptions["body"],
    options?: Omit<ApiRequestOptions, "body" | "method">,
  ) => request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(
    path: string,
    body?: ApiRequestOptions["body"],
    options?: Omit<ApiRequestOptions, "body" | "method">,
  ) => request<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(
    path: string,
    body?: ApiRequestOptions["body"],
    options?: Omit<ApiRequestOptions, "body" | "method">,
  ) => request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: Omit<ApiRequestOptions, "method">) =>
    request<T>(path, { ...options, method: "DELETE" }),
  request,
};
