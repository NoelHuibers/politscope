// @ts-expect-error — built file resolved at runtime by Vercel
import server from "../dist/server/server.js";
import { health } from "./_health";

export const config = {
  runtime: "nodejs",
};

export default async function handler(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/health") {
    return health();
  }
  return server.fetch(request);
}
