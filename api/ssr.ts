// @ts-expect-error — built file resolved at runtime by Vercel
import server from "../dist/server/server.js";
import { health } from "./_health.js";

export const config = {
  runtime: "nodejs",
};

type AnyHeaders = Headers | Record<string, string | string[] | undefined>;

function getHeader(headers: AnyHeaders, name: string): string | undefined {
  const asUnknown = headers as unknown;
  if (headers instanceof Headers || typeof (asUnknown as { get?: unknown }).get === "function") {
    return (asUnknown as Headers).get(name) ?? undefined;
  }
  const plain = headers as Record<string, string | string[] | undefined>;
  const lower = name.toLowerCase();
  const v = plain[lower] ?? plain[name];
  if (Array.isArray(v)) return v[0];
  return v;
}

function toWebHeaders(headers: AnyHeaders): Headers {
  if (headers instanceof Headers) return headers;
  const asUnknown = headers as unknown;
  if (typeof (asUnknown as { get?: unknown }).get === "function") {
    const h = new Headers();
    for (const [k, v] of asUnknown as Iterable<[string, string]>) h.append(k, v);
    return h;
  }
  const out = new Headers();
  for (const [k, v] of Object.entries(headers as Record<string, string | string[] | undefined>)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) out.append(k, item);
    } else {
      out.append(k, v);
    }
  }
  return out;
}

type VercelRequestLike = {
  url: string;
  method?: string;
  headers: AnyHeaders;
  body?: BodyInit | null;
};

export default async function handler(request: VercelRequestLike): Promise<Response> {
  const host =
    getHeader(request.headers, "x-forwarded-host") ??
    getHeader(request.headers, "host") ??
    "localhost";
  const proto = getHeader(request.headers, "x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const url = new URL(request.url, base);

  if (url.pathname === "/api/health") {
    return health();
  }

  const method = request.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  const webRequest = new Request(url.toString(), {
    method,
    headers: toWebHeaders(request.headers),
    body: hasBody ? request.body : undefined,
  });

  return server.fetch(webRequest);
}
