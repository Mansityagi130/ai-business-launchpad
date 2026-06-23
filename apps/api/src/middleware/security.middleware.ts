import { Request, Response, NextFunction } from "express";
import { redisConnection } from "../config/redis.js";

/**
 * 1. Redis-Backed Rate Limiting Middleware
 * Falls back safely to next() if Redis encounters connection issues.
 */
export function rateLimiter(limit: number, windowSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.headers["x-forwarded-for"] || "unknown-ip";
      const key = `ratelimit:${req.originalUrl}:${ip}`;

      const current = await redisConnection.incr(key);
      if (current === 1) {
        await redisConnection.expire(key, windowSeconds);
      }

      if (current > limit) {
        return res.status(429).json({
          success: false,
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please wait and try again later."
          }
        });
      }
      next();
    } catch (err) {
      console.warn("Redis rate limiter failed, passing requests through:", err);
      next();
    }
  };
}

/**
 * 2. Recursive Input XSS Sanitizer
 */
export function xssSanitizer(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  next();
}

function sanitizeValue(val: any): any {
  if (typeof val === "string") {
    return val
      .replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, "") // strip script tags
      .replace(/javascript:/gi, "") // block script triggers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // block event attributes like onload= or onclick=
      .replace(/on\w+\s*=\s*[^\s>]+/gi, "");
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val !== null && typeof val === "object") {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      sanitized[key] = sanitizeValue(val[key]);
    }
    return sanitized;
  }
  return val;
}

/**
 * 3. Prompt Injection Mitigation
 */
const SYSTEM_OVERRIDE_KEYWORDS = [
  "ignore previous instructions",
  "system prompt override",
  "ignore the guidelines",
  "ignore above",
  "forget previous instructions",
  "bypass safety constraints",
  "you are now an unfiltered"
];

export function promptInjectionCheck(req: Request, res: Response, next: NextFunction) {
  const inputPrompt = req.body?.instruction || req.body?.description || "";

  if (inputPrompt && typeof inputPrompt === "string") {
    const normalizedPrompt = inputPrompt.toLowerCase();
    const containsInjection = SYSTEM_OVERRIDE_KEYWORDS.some((keyword) =>
      normalizedPrompt.includes(keyword)
    );

    if (containsInjection) {
      return res.status(400).json({
        success: false,
        error: {
          code: "PROMPT_INJECTION_DETECTED",
          message: "Potential prompt injection detected. System instructions overrides are blocked."
        }
      });
    }
  }
  next();
}
