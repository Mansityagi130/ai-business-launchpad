import dotenv from "dotenv";

dotenv.config();

export class LoggerService {
  private static isProduction = process.env.NODE_ENV === "production";

  static info(message: string, metadata: any = {}) {
    this.log("INFO", message, metadata);
  }

  static warn(message: string, metadata: any = {}) {
    this.log("WARN", message, metadata);
  }

  static error(message: string, error?: any, metadata: any = {}) {
    const errorDetails = error
      ? {
          message: error.message || error,
          stack: error.stack,
          ...error
        }
      : undefined;

    this.log("ERROR", message, { ...metadata, error: errorDetails });
    
    // Stub for Sentry capture:
    if (process.env.SENTRY_DSN) {
      // In production, we would call: Sentry.captureException(error || new Error(message));
      // console.log("[Sentry] Capturing exception...");
    }
  }

  private static log(level: string, message: string, metadata: any) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...metadata
    };

    if (this.isProduction) {
      console.log(JSON.stringify(payload));
    } else {
      const color =
        level === "ERROR"
          ? "\x1b[31m"
          : level === "WARN"
            ? "\x1b[33m"
            : "\x1b[36m";
      const reset = "\x1b[0m";
      console.log(
        `[${timestamp}] ${color}${level}${reset}: ${message}`,
        Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ""
      );
    }
  }
}
