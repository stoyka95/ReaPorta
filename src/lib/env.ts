import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL je povinná proměnná prostředí.")
    .refine(
      (val) => val.startsWith("postgres://") || val.startsWith("postgresql://"),
      "DATABASE_URL musí začínat postgres:// nebo postgresql://.",
    ),
  APP_URL: z.string().url("APP_URL musí být platná URL.").default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET musí mít alespoň 16 znaků."),
  NEXT_PUBLIC_MAP_STYLE_URL: z
    .string()
    .url("NEXT_PUBLIC_MAP_STYLE_URL musí být platná URL.")
    .default("https://tiles.openfreemap.org/styles/positron"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_FROM: z.string().min(1).default("ReaPorta <noreply@reaporta.test>"),
  STORAGE_DIR: z.string().min(1).default("./storage"),
  CRON_SECRET: z.string().min(8, "CRON_SECRET musí mít alespoň 8 znaků."),
  GEOCODER: z.enum(["none", "nominatim", "mapycz"]).default("none"),
  MAPYCZ_API_KEY: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Neplatná konfigurace prostředí (.env):\n${details}`);
  }
  return result.data;
}

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = parseEnv(process.env);
  }
  return cachedEnv;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}
