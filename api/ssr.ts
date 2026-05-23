// @ts-expect-error — built file resolved at runtime by Vercel
import server from "../dist/server/server.js";
import { health } from "./_health.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(request: Request): Promise<Response> {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const url = new URL(request.url, base);

  if (url.pathname === "/api/health") {
    return health();
  }

  return server.fetch(new Request(url.toString(), request));
}
