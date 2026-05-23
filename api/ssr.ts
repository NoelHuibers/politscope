// @ts-expect-error — built file resolved at runtime by Vercel
import server from "../dist/server/server.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(request: Request): Promise<Response> {
  return server.fetch(request);
}
