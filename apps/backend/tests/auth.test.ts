import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, connectTestDb, cleanDb } from "./helpers";
import { User } from "../src/models/User";

describe("auth", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("registers a patient and returns a token without exposing the password", async () => {
    const res = await api().post("/api/v1/auth/register").send({
      name: "Test Patient",
      email: "patient@example.com",
      password: "StrongPass1",
      role: "PATIENT",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.id).toBeTruthy();
    expect(res.body.data.user.email).toBe("patient@example.com");
    expect(res.body.data.user).not.toHaveProperty("password");
    expect(JSON.stringify(res.body)).not.toMatch(/StrongPass1/);
  });

  it("rejects duplicate registration with 409", async () => {
    const payload = {
      name: "Test Patient",
      email: "dup@example.com",
      password: "StrongPass1",
      role: "PATIENT",
    };
    await api().post("/api/v1/auth/register").send(payload);
    const res = await api().post("/api/v1/auth/register").send(payload);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("rejects ADMIN public registration with 403", async () => {
    const res = await api().post("/api/v1/auth/register").send({
      name: "Admin",
      email: "admin@example.com",
      password: "StrongPass1",
      role: "ADMIN",
    });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("rejects invalid registration payloads with 400 validation errors", async () => {
    const badEmail = await api().post("/api/v1/auth/register").send({
      name: "A",
      email: "not-an-email",
      password: "StrongPass1",
      role: "PATIENT",
    });
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.error.code).toBe("BAD_REQUEST");

    const weakPassword = await api().post("/api/v1/auth/register").send({
      name: "B",
      email: "b@example.com",
      password: "weak",
      role: "PATIENT",
    });
    expect(weakPassword.status).toBe(400);
  });

  it("logs in with valid credentials", async () => {
    await api().post("/api/v1/auth/register").send({
      name: "Loginer",
      email: "login@example.com",
      password: "StrongPass1",
      role: "PATIENT",
    });
    const res = await api().post("/api/v1/auth/login").send({
      email: "login@example.com",
      password: "StrongPass1",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.role).toBe("PATIENT");
  });

  it("rejects wrong password with 401", async () => {
    await api().post("/api/v1/auth/register").send({
      name: "Loginer",
      email: "login2@example.com",
      password: "StrongPass1",
      role: "PATIENT",
    });
    const res = await api().post("/api/v1/auth/login").send({
      email: "login2@example.com",
      password: "WrongPassword9",
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects login for deactivated accounts with 401", async () => {
    await api().post("/api/v1/auth/register").send({
      name: "OfflineUser",
      email: "offline@example.com",
      password: "StrongPass1",
      role: "PATIENT",
    });
    await User.findOneAndUpdate({ email: "offline@example.com" }, { isActive: false });
    const res = await api().post("/api/v1/auth/login").send({
      email: "offline@example.com",
      password: "StrongPass1",
    });
    expect(res.status).toBe(401);
  });

  it("returns the current profile via /me with a valid token", async () => {
    const token = await registerAndGetTokenInternal("pat@example.com");
    const res = await api()
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("pat@example.com");
    expect(res.body.data.role).toBe("PATIENT");
  });

  it("rejects /me without a token", async () => {
    const res = await api().get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects /me with a malformed token", async () => {
    const res = await api()
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer not.a.jwt");
    expect(res.status).toBe(401);
  });
});

async function registerAndGetTokenInternal(email: string) {
  const res = await api().post("/api/v1/auth/register").send({
    name: "Me",
    email,
    password: "StrongPass1",
    role: "PATIENT",
  });
  return res.body.data.token as string;
}