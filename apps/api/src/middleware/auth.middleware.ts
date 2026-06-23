import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";

// Extend Request interface to hold authenticated user metadata
export interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authorization token is missing. Send a Bearer token in the header."
        }
      });
    }

    const token = authHeader.split(" ")[1];
    const user = await AuthService.verifyToken(token);
    
    // Attach validated user to request
    req.user = user;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: error.message || "Invalid session or credentials."
      }
    });
  }
}
