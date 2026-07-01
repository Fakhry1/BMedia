/// <reference types="node" />
const DEFAULT_API_BASE = "https://bmediaprod-production.up.railway.app";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function usesLoopbackHost(value: string) {
  if (!value || value.startsWith("/")) return false;

  try {
    const { hostname } = new URL(value);
    return LOOPBACK_HOSTS.has(hostname.toLowerCase());
  } catch {
    return false;
  }
}

const configuredApiBase = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE
);

export const API_BASE =
  typeof window !== "undefined" && usesLoopbackHost(configuredApiBase)
    ? ""
    : configuredApiBase;

export const REQUEST_TIMEOUT_MS = 15_000;
