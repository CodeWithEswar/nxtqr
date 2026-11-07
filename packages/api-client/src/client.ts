import type { ApiErrorResponse } from "@nxtqr/shared-types";
import { generateCorrelationId } from "@nxtqr/observability";

export class ApiClientError extends Error {
  public status: number;
  public details?: unknown;
  public correlationId?: string;

  constructor(status: number, message: string, details?: unknown, correlationId?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
    this.correlationId = correlationId;
  }
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
  correlationId?: string;
}

export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const {
    timeoutMs = 10000,
    correlationId = generateCorrelationId(),
    headers = {},
    ...rest
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-ID": correlationId,
        ...headers,
      },
    });

    if (!res.ok) {
      let errorBody: ApiErrorResponse | null = null;
      try {
        errorBody = (await res.json()) as ApiErrorResponse;
      } catch {
        // Response was not JSON
      }

      throw new ApiClientError(
        res.status,
        errorBody?.error?.message ?? `Request failed with status ${res.status}`,
        errorBody?.error?.details,
        correlationId,
      );
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiClientError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiClientError(
        408,
        `Request timed out after ${timeoutMs}ms`,
        undefined,
        correlationId,
      );
    }
    throw new ApiClientError(
      500,
      err instanceof Error ? err.message : "Unknown network error",
      undefined,
      correlationId,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
