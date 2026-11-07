import { NextResponse } from "next/server";
import { generateCorrelationId } from "@nxtqr/observability";

export async function GET() {
  const correlationId = generateCorrelationId();
  return NextResponse.json(
    {
      status: "ok",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      platform: "NXTQR Studio",
      environment: process.env.NODE_ENV || "development",
      correlationId,
    },
    {
      headers: {
        "X-Correlation-ID": correlationId,
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
