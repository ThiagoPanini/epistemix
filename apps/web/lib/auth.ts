import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            mapProfileToUser: (profile: { login: string }) => ({
              username: profile.login,
            }),
          },
        }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            mapProfileToUser: (profile: { email: string }) => ({
              username: profile.email.split("@")[0],
            }),
          },
        }
      : {}),
  },
  user: {
    // Matches Alembic migration 20260612160243 (auth_ prefix avoids SQL reserved-word collision)
    modelName: "auth_user",
    additionalFields: {
      username: {
        type: "string",
        required: true,
        unique: true,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        // SEC-1: server-controlled — client cannot set role at signup (see docs/CONTEXT.md invariant 19).
        input: false,
      },
    },
  },
  session: {
    modelName: "auth_session",
  },
  account: {
    modelName: "auth_account",
  },
  verification: {
    modelName: "auth_verification",
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
