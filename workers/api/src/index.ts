import type { QueueMessageEnvelope } from "@nxtqr/shared-types";
import { generateCorrelationId } from "@nxtqr/observability";
import { InMemoryRateLimiter } from "@nxtqr/security";

export interface Env {
  ENVIRONMENT: string;
  CORS_ALLOWED_ORIGINS: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SIMULATION_QUEUE: Queue<QueueMessageEnvelope>;
  ANALYTICS_QUEUE: Queue<QueueMessageEnvelope>;
}

const rateLimiter = new InMemoryRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000,
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const correlationId = request.headers.get("X-Correlation-ID") || generateCorrelationId("cf");
    const clientIp = request.headers.get("CF-Connecting-IP") || "127.0.0.1";

    // Rate limit check
    const rateLimit = rateLimiter.check(clientIp);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please slow down.",
            correlationId,
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(rateLimit.resetMs / 1000).toString(),
            "X-Correlation-ID": correlationId,
          },
        },
      );
    }

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": env.CORS_ALLOWED_ORIGINS,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Correlation-ID",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Edge Health Check
    if (url.pathname === "/health" || url.pathname === "/") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "nxtqr-worker-api",
          environment: env.ENVIRONMENT,
          timestamp: new Date().toISOString(),
          correlationId,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": env.CORS_ALLOWED_ORIGINS,
            "X-Correlation-ID": correlationId,
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        error: {
          code: "NOT_FOUND",
          message: "Route not found on edge API worker",
          correlationId,
        },
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-ID": correlationId,
        },
      },
    );
  },
};
