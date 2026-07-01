import { apiFetch } from "./api";

export interface UserInfo {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/api/v1/Auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function saveSession(result: LoginResult) {
  const expiry = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem("bmedia_token", result.accessToken);
  localStorage.setItem("bmedia_refresh_token", result.refreshToken);
  localStorage.setItem("bmedia_user", JSON.stringify(result.user));
  localStorage.setItem("bmedia_session_expiry", String(expiry));
}

export function clearSession() {
  localStorage.removeItem("bmedia_token");
  localStorage.removeItem("bmedia_refresh_token");
  localStorage.removeItem("bmedia_user");
  localStorage.removeItem("bmedia_session_expiry");
}

function isSessionExpired(): boolean {
  const expiry = localStorage.getItem("bmedia_session_expiry");
  if (!expiry) return true;
  return Date.now() > Number(expiry);
}

export function getUser(): UserInfo | null {
  if (typeof window === "undefined") return null;
  if (isSessionExpired()) { clearSession(); return null; }
  const raw = localStorage.getItem("bmedia_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("bmedia_user");
    return null;
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  if (isSessionExpired()) { clearSession(); return false; }
  return !!localStorage.getItem("bmedia_token");
}

export function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
  return apiFetch<boolean>("/api/v1/Auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
