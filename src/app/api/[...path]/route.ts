import type { NextRequest } from "next/server";
import http from "node:http";
import https from "node:https";

const DEFAULT_API_PROXY_TARGET = "https://bmediaprod-production.up.railway.app";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getProxyTarget() {
  return trimTrailingSlash(
    process.env.API_PROXY_TARGET ??
      process.env.NEXT_PUBLIC_API_URL ??
      DEFAULT_API_PROXY_TARGET
  );
}

function isLocalDevCertificate(url: URL) {
  return process.env.NODE_ENV !== "production" &&
    url.protocol === "https:" &&
    LOOPBACK_HOSTS.has(url.hostname.toLowerCase());
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const target = new URL(`${getProxyTarget()}/api/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.delete("host");
  upstreamHeaders.delete("connection");
  upstreamHeaders.delete("content-length");

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : Buffer.from(await request.arrayBuffer());

  const transport = target.protocol === "https:" ? https : http;

  return new Promise<Response>((resolve) => {
    const upstream = transport.request(
      target,
      {
        method: request.method,
        headers: Object.fromEntries(upstreamHeaders.entries()),
        rejectUnauthorized: !isLocalDevCertificate(target),
      },
      (upstreamResponse) => {
        const chunks: Buffer[] = [];

        upstreamResponse.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        upstreamResponse.on("end", () => {
          resolve(
            new Response(Buffer.concat(chunks), {
              status: upstreamResponse.statusCode ?? 502,
             headers: (() => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(upstreamResponse.headers)) {
    if (!value) continue;
    result[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  return result;
})(),
            })
          );
        });
      }
    );

    upstream.on("error", (error) => {
      resolve(
        Response.json(
          {
            error: "Proxy request failed",
            detail: error instanceof Error ? error.message : "Unknown proxy error",
          },
          { status: 502 }
        )
      );
    });

    if (body && body.length > 0) {
      upstream.write(body);
    }

    upstream.end();
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
