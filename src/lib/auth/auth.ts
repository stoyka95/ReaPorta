import crypto from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { buildResetPasswordEmail, buildVerificationEmail, queueEmail } from "@/lib/email";
import { slugify } from "@/lib/slug";

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function getAuthSecret(): string {
  return process.env.BETTER_AUTH_SECRET ?? "dev-only-better-auth-secret-reaporta-32-chars-minimum";
}

function createAuthInstance() {
  return betterAuth({
    appName: "ReaPorta",
    baseURL: getAppUrl(),
    secret: getAuthSecret(),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    user: {
      fields: {
        image: "avatarKey",
      },
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: true,
        },
        phone: {
          type: "string",
          required: false,
          input: true,
        },
        blockedAt: {
          type: "date",
          required: false,
          input: false,
        },
        deletedAt: {
          type: "date",
          required: false,
          input: false,
        },
        emailVerifiedAt: {
          type: "date",
          required: false,
          input: false,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      autoSignIn: false,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
      async sendResetPassword({ user, token }) {
        const resetUrl = `${getAppUrl()}/obnova-hesla?token=${encodeURIComponent(token)}`;
        const msg = buildResetPasswordEmail({
          name: user.name || "uživateli",
          resetUrl,
        });
        await queueEmail({
          toEmail: user.email,
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      async sendVerificationEmail({ user, token }) {
        const verifyUrl = `${getAppUrl()}/overeni-emailu?token=${encodeURIComponent(token)}`;
        const msg = buildVerificationEmail({
          name: user.name || "uživateli",
          verifyUrl,
        });
        await queueEmail({
          toEmail: user.email,
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
        });
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14, // 14 dní
      updateAge: 60 * 60 * 24, // obnovit 1× denně
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      cookiePrefix: "reaporta",
      useSecureCookies: getAppUrl().startsWith("https://"),
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            // Veřejná registrace smí vytvořit pouze "user" nebo "agent" (nikdy "admin")
            const requestedRole = (user as { role?: string }).role;
            const safeRole = requestedRole === "agent" ? "agent" : "user";
            return {
              data: {
                ...user,
                role: safeRole,
              },
            };
          },
          after: async (user) => {
            const role = (user as { role?: string }).role;
            if (role === "agent") {
              const db = getDb();
              const baseSlug = slugify(user.name || "makler") || "makler";
              const suffix = user.id.slice(0, 6);
              await db
                .insert(schema.agentProfiles)
                .values({
                  userId: user.id,
                  displayName: user.name || "Makléř",
                  slug: `${baseSlug}-${suffix}`,
                  emailPublic: user.email,
                  phonePublic: (user as { phone?: string | null }).phone ?? null,
                  languages: ["cs"],
                })
                .onConflictDoNothing();
            }
          },
        },
        update: {
          before: async (data) => {
            if (data.emailVerified === true && !("emailVerifiedAt" in data)) {
              return {
                data: {
                  ...data,
                  emailVerifiedAt: new Date(),
                },
              };
            }
            return { data };
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const db = getDb();
            const [u] = await db
              .select({
                blockedAt: schema.users.blockedAt,
                deletedAt: schema.users.deletedAt,
              })
              .from(schema.users)
              .where(eq(schema.users.id, session.userId))
              .limit(1);

            if (!u || u.blockedAt !== null || u.deletedAt !== null) {
              return false;
            }
            return { data: session };
          },
        },
      },
    },
    plugins: [nextCookies()],
  });
}

type AuthInstance = ReturnType<typeof createAuthInstance>;

let cachedAuth: AuthInstance | null = null;

export function getAuth(): AuthInstance {
  if (!cachedAuth) {
    cachedAuth = createAuthInstance();
  }
  return cachedAuth;
}
