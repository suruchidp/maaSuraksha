import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, connectTestDb, cleanDb } from "./helpers";

describe("health checks", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("returns 200 OK with service metadata", async () => {
    const res = await api().get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("maasuraksha-backend");
  });

  it("returns 404 for unknown routes with the correct error shape", async () => {
    const res = await api().get("/api/v1/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});