/** Stable error codes; each maps to a translated, user-friendly message. */
export type AppErrorCode =
  | "storage_unavailable"
  | "storage_init_failed"
  | "not_found"
  | "validation_failed"
  | "write_failed"
  | "in_use"
  | "unknown";

/** Application error with a code that the UI can translate. */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly cause?: unknown;

  constructor(code: AppErrorCode, message?: string, options?: { cause?: unknown }) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    this.cause = options?.cause;
  }
}

/** Normalizes anything thrown into an AppError. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError("unknown", error.message, { cause: error });
  return new AppError("unknown", String(error), { cause: error });
}
