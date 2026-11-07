import { maskSensitiveData } from "@nxtqr/security";
import { generateCorrelationId } from "./correlation";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class StructuredLogger {
  private correlationId?: string;

  public setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  public getCorrelationId(): string {
    if (!this.correlationId) {
      this.correlationId = generateCorrelationId();
    }
    return this.correlationId;
  }

  private write(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    err?: Error,
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId ?? this.getCorrelationId(),
      context: context ? (maskSensitiveData(context) as Record<string, unknown>) : undefined,
      error: err
        ? {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
          }
        : undefined,
    };

    const serialized = JSON.stringify(entry);

    switch (level) {
      case "error":
        console.error(serialized);
        break;
      case "warn":
        console.warn(serialized);
        break;
      case "info":
        console.info(serialized);
        break;
      case "debug":
        if (process.env.NODE_ENV !== "production") {
          console.debug(serialized);
        }
        break;
    }
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.write("debug", message, context);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.write("info", message, context);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.write("warn", message, context);
  }

  public error(message: string, err?: Error | unknown, context?: Record<string, unknown>): void {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    this.write("error", message, context, errorObj);
  }
}

export const logger = new StructuredLogger();
