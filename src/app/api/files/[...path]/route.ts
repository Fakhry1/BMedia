import type { NextRequest } from "next/server";
import http from "node:http";
import https from "node:https";

const DEFAULT_BACKEND = "https://bmediaprod-production.up.railway.app";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBackendBase() {
  const raw =
    process.env.API_PROXY_TARGET ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_BACKEND;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function isLocalDevCert(url: URL) {
  return (
    process.env.NODE_ENV !== "production" &&
    url.protocol === "https:" &&
    LOOPBACK_HOSTS.has(url.hostname.toLowerCase())
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const target = new URL(`${getBackendBase()}/files/${path.join("/")}`);

  const transport = target.protocol === "https:" ? https : http;

  return new Promise<Response>((resolve) => {
    const upstream = transport.request(
      target,
      { method: "GET", rejectUnauthorized: !isLocalDevCert(target) },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        );
        res.on("end", () => {
         const headers = new Headers(
  Object.entries(res.headers).flatMap(([k, v]) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map((val): [string, string] => [k, val]);
    return [[k, v] as [string, string]];
  })
);
          // Allow the browser to use the response (needed for createObjectURL).
          headers.set("Access-Control-Allow-Origin", "*");
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode ?? 502,
              headers,
            })
          );
        });
      }
    );

    upstream.on("error", (err) =>
      resolve(
        Response.json(
          { error: "File proxy failed", detail: err.message },
          { status: 502 }
        )
      )
    );

    upstream.end();
  });
}
