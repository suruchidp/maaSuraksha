import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { connectTestDb, cleanDb } from "./helpers";
import { User } from "../src/models/User";
import { UserRole } from "@maasuraksha/shared";
import { seedAdmin } from "../../../scripts/seed-admin";

describe("development admin seed", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("creates an active ADMIN on first run with a bcrypt-hashed password", async () => {
    const result = await seedAdmin({
      name: "Dev Admin",
      email: "admin@example.com",
      password: "StrongPass1",
    });

    expect(result.created).toBe(true);
    expect(result.name).toBe("Dev Admin");
    expect(result.email).toBe("admin@example.com");
    expect(result.role).toBe(UserRole.ADMIN);

    const doc = await User.findOne({ email: "admin@example.com" }).select(
      "+password"
    );
    expect(doc).not.toBeNull();
    expect(doc!.role).toBe(UserRole.ADMIN);
    expect(doc!.isActive).toBe(true);

    expect(doc!.password).not.toBe("StrongPass1");
    expect(await doc!.comparePassword("StrongPass1")).toBe(true);
    expect(await doc!.comparePassword("WrongPass1")).toBe(false);
  });

  it("refuses to create a second ADMIN if one already exists", async () => {
    const first = await seedAdmin({
      name: "Dev Admin",
      email: "admin@example.com",
      password: "StrongPass1",
    });
    expect(first.created).toBe(true);

    const second = await seedAdmin({
      name: "Second Admin",
      email: "admin2@example.com",
      password: "StrongPass1",
    });

    expect(second.created).toBe(false);
    expect(second.skippedBecause).toBe("ADMIN_EXISTS");
    expect(second.email).toBe("admin@example.com");

    const admins = await User.find({ role: UserRole.ADMIN });
    expect(admins).toHaveLength(1);
    expect(admins[0]!.email).toBe("admin@example.com");
  });

  it("rejects admin passwords that do not meet the registration policy", async () => {
    await expect(
      seedAdmin({
        name: "Dev Admin",
        email: "admin@example.com",
        password: "weak",
      })
    ).rejects.toThrow();

    const count = await User.countDocuments({ role: UserRole.ADMIN });
    expect(count).toBe(0);
  });
});