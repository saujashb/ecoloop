export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateRuntimeEnv } = await import("./lib/env");
    validateRuntimeEnv();
  }
}
