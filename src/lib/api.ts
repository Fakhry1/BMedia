import { API_BASE, REQUEST_TIMEOUT_MS } from "./config";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function clearAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("bmedia_token");
  localStorage.removeItem("bmedia_refresh_token");
  localStorage.removeItem("bmedia_user");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("bmedia_token") : null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.detail ?? json.title ?? json.message ?? text;
    } catch {}

    if (res.status === 401 && token) {
      clearAuthToken();
      if (typeof window !== "undefined") window.location.href = "/login";
    }

    throw new ApiError(res.status, message || `HTTP ${res.status}`);
  }

  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (text ? JSON.parse(text) : undefined) as T;
}
