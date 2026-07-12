import { randomUUID } from "crypto";

/** Log internal details server-side; return a safe correlation ID for clients. */
export function logServerError(context: string, cause?: unknown): string {
  const correlationId = randomUUID().slice(0, 8);
  const detail =
    cause instanceof Error
      ? cause.message
      : cause !== undefined
        ? String(cause)
        : context;
  console.error(`[${correlationId}] ${context}: ${detail}`);
  return correlationId;
}

export class AppError extends Error {
  readonly correlationId: string;

  constructor(correlationId: string) {
    super(`Something went wrong. Reference: ${correlationId}`);
    this.name = "AppError";
    this.correlationId = correlationId;
  }
}

/** Fail with a generic client message; log the real reason server-side only. */
export function failSafe(internalReason: string, cause?: unknown): never {
  const correlationId = logServerError(internalReason, cause);
  throw new AppError(correlationId);
}
