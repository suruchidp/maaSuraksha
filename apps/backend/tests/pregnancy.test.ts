import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, connectTestDb, cleanDb, registerAndGetToken } from "./helpers";

describe("pregnancy profile endpoint", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("returns 404 NOT_FOUND for a new patient with no pregnancy profile", async () => {
    const token = await registerAndGetToken({
      name: "New Patient",
      email: "new@patient.com",
      password: "StrongPass1",
      role: "PATIENT",
    });

    const res = await api()
      .get("/api/v1/pregnancy")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toBe("Pregnancy profile not found");
  });

  it("requires authentication", async () => {
    const res = await api().get("/api/v1/pregnancy");
    expect(res.status).toBe(401);
  });

  it("returns the saved profile after a patient creates one", async () => {
    const token = await registerAndGetToken({
      name: "Expecting Parent",
      email: "expecting@parent.com",
      password: "StrongPass1",
      role: "PATIENT",
    });

    const create = await api()
      .post("/api/v1/pregnancy")
      .set("Authorization", `Bearer ${token}`)
      .send({ lmp: "2026-01-15", gravida: 1, para: 0 });

    expect(create.status).toBe(200);
    expect(create.body.success).toBe(true);
    expect(create.body.data.id).toBeTruthy();
    expect(create.body.data.expectedDueDate).toBeTruthy();

    const get = await api()
      .get("/api/v1/pregnancy")
      .set("Authorization", `Bearer ${token}`);

    expect(get.status).toBe(200);
    expect(get.body.success).toBe(true);
    expect(get.body.data.id).toBe(create.body.data.id);
    expect(get.body.data.gestationalWeek).toBeGreaterThan(0);
  });
});