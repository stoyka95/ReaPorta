import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("Argon2id password hashing (AC-5.6)", () => {
  it("hashes passwords with argon2id and verifies valid vs invalid passwords", async () => {
    const hash = await hashPassword("BezpecneHeslo123!");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword({ hash, password: "BezpecneHeslo123!" })).toBe(true);
    expect(await verifyPassword({ hash, password: "SpatneHeslo123!" })).toBe(false);
  });
});
