import { describe, expect, it } from "vitest";
import { health } from "./_health";

describe("health endpoint", () => {
  it.skipIf(!process.env.DATABASE_URL)(
    "returns 200 with shape { ok, now, mps_count, speeches_count, latency_ms }",
    async () => {
      const res = await health();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(typeof body.now).toBe("string");
      expect(typeof body.mps_count).toBe("number");
      expect(typeof body.speeches_count).toBe("number");
      expect(typeof body.latency_ms).toBe("number");
    },
  );
});
