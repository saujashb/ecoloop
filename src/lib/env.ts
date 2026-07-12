/** Read a required environment variable. Throws at startup if missing. */
export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Read an optional environment variable. */
export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/**
 * Validate critical env vars before the app handles traffic.
 * Called from instrumentation and Prisma client init.
 */
export function validateRuntimeEnv(): void {
  const databaseUrl = requireEnv("DATABASE_URL");
  requireEnv("SESSION_SECRET");

  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }

  if (parsed.hostname === "host" || parsed.username === "user") {
    throw new Error("DATABASE_URL appears to be a placeholder — set a real Neon URL.");
  }

  if (process.env.NODE_ENV === "production") {
    const sslmode = parsed.searchParams.get("sslmode");
    const ssl = parsed.searchParams.get("ssl");
    if (sslmode !== "require" && ssl !== "true") {
      throw new Error(
        "DATABASE_URL must use TLS in production (add ?sslmode=require)."
      );
    }
  }
}
