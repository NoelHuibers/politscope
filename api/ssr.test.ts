import { describe, expect, it, vi } from "vitest";

vi.mock("../dist/server/server.js", () => ({
  default: {
    fetch: async (req: Request): Promise<Response> => {
      // Echo back the URL h3 would have parsed — proves we built an absolute URL.
      return new Response(JSON.stringify({ url: req.url, method: req.method }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  },
}));

vi.mock("./_health.js", () => ({
  health: async () =>
    new Response(JSON.stringify({ ok: true, source: "mock-health" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
}));

describe("api/ssr.ts Vercel adapter", () => {
  it("handles Node-style request (headers as plain object, url as path)", async () => {
    const { GET: handler } = await import("./ssr.js");

    const request = {
      url: "/",
      method: "GET",
      headers: {
        host: "politscope.vercel.app",
        "x-forwarded-host": "politscope.vercel.app",
        "x-forwarded-proto": "https",
      },
    };

    const res = await handler(request);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { url: string; method: string };
    expect(body.url).toBe("https://politscope.vercel.app/");
    expect(body.method).toBe("GET");
  });

  it("handles a path with query string", async () => {
    const { GET: handler } = await import("./ssr.js");

    const request = {
      url: "/de/abgeordnete/123?foo=bar",
      method: "GET",
      headers: { host: "example.test", "x-forwarded-proto": "https" },
    };

    const res = await handler(request);
    const body = (await res.json()) as { url: string };
    expect(body.url).toBe("https://example.test/de/abgeordnete/123?foo=bar");
  });

  it("short-circuits /api/health before delegating to TanStack server", async () => {
    const { GET: handler } = await import("./ssr.js");

    const request = {
      url: "/api/health",
      method: "GET",
      headers: { host: "x.test", "x-forwarded-proto": "https" },
    };

    const res = await handler(request);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("mock-health");
  });

  it("handles Web-Standard request (Headers instance, absolute URL)", async () => {
    const { GET: handler } = await import("./ssr.js");

    const headers = new Headers();
    headers.set("host", "example.test");
    headers.set("x-forwarded-proto", "https");

    const request = {
      url: "https://example.test/somepage",
      method: "GET",
      headers,
    };

    const res = await handler(request);
    const body = (await res.json()) as { url: string };
    expect(body.url).toBe("https://example.test/somepage");
  });

  it("falls back to localhost when no host header is provided", async () => {
    const { GET: handler } = await import("./ssr.js");

    const request = {
      url: "/",
      method: "GET",
      headers: {},
    };

    const res = await handler(request);
    const body = (await res.json()) as { url: string };
    expect(body.url).toBe("https://localhost/");
  });
});
