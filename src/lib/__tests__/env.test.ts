import { describe, it, expect } from "vitest";
import { parseEnv } from "@/lib/env";
import { assertSafeDevOrTestDatabase } from "@/db/client";

describe("parseEnv", () => {
  const validEnv = {
    NODE_ENV: "test",
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/reaporta_test",
    APP_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: "a-very-long-random-secret-value",
    NEXT_PUBLIC_MAP_STYLE_URL: "https://tiles.openfreemap.org/styles/positron",
    SMTP_HOST: "localhost",
    SMTP_PORT: "1025",
    MAIL_FROM: "ReaPorta <noreply@reaporta.test>",
    STORAGE_DIR: "./storage",
    CRON_SECRET: "cron-secret-1234",
    GEOCODER: "none",
  };

  it("validates complete environment configuration", () => {
    const parsed = parseEnv(validEnv);
    expect(parsed.DATABASE_URL).toContain("reaporta_test");
    expect(parsed.SMTP_PORT).toBe(1025);
    expect(parsed.GEOCODER).toBe("none");
  });

  it("fails with clear Czech message when DATABASE_URL is missing", () => {
    expect(() => parseEnv({ ...validEnv, DATABASE_URL: "" })).toThrow(
      /Neplatná konfigurace prostředí/,
    );
  });

  it("rejects non-postgres DATABASE_URL", () => {
    expect(() => parseEnv({ ...validEnv, DATABASE_URL: "mysql://localhost/db" })).toThrow(
      /postgres:\/\//,
    );
  });
});

describe("assertSafeDevOrTestDatabase", () => {
  it("allows dev and test database names", () => {
    expect(assertSafeDevOrTestDatabase("postgres://u:p@localhost:5432/reaporta_dev")).toBe(
      "reaporta_dev",
    );
    expect(assertSafeDevOrTestDatabase("postgres://u:p@localhost:5432/reaporta_test")).toBe(
      "reaporta_test",
    );
  });

  it("blocks production database names", () => {
    expect(() =>
      assertSafeDevOrTestDatabase("postgres://u:p@localhost:5432/reaporta_prod"),
    ).toThrow(/Bezpečnostní pojistka/);
  });
});
