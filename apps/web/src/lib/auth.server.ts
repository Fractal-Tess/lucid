import { betterAuth } from "better-auth";

// Minimal Better Auth instance for server-side token validation in SvelteKit
// This is used by hooks.server.ts to extract and validate auth tokens
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "",
  baseURL: process.env.PUBLIC_SITE_URL || "http://localhost:5173",
});
