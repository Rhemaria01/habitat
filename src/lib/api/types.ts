/** Standard server-action / API response shape for mutations. */
export type ApiSuccess<T = void> = {
  ok: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  ok: false;
  error: string;
  message?: string;
};

export type ApiResponse<T = void> = ApiSuccess<T> | ApiFailure;

/** @deprecated Prefer `ApiResponse` — kept for existing action imports. */
export type ActionResult<T = void> = ApiResponse<T>;

export class ApiError extends Error {
  readonly userMessage: string;

  constructor(error: string, message?: string) {
    super(message ?? error);
    this.name = "ApiError";
    this.userMessage = error;
  }
}

export function apiOk<T>(data: T, message?: string): ApiSuccess<T> {
  return message ? { ok: true, data, message } : { ok: true, data };
}

export function apiFail(error: string, message?: string): ApiFailure {
  return message ? { ok: false, error, message } : { ok: false, error };
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.userMessage;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function unwrapApi<T>(result: ApiResponse<T>): T {
  if (!result.ok) throw new ApiError(result.error, result.message);
  return result.data;
}
