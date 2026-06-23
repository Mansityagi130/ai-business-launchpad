import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";
import { BillingService } from "../services/billing.service.js";

export async function enforceWebsiteLimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User session required." }
      });
    }

    const canCreate = await BillingService.canCreateWebsite(userId);
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        code: "UPGRADE_REQUIRED",
        message: "Your Early Access plan includes 1 website. Upgrade to continue."
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message || error }
    });
  }
}

export async function enforceAIEditLimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User session required." }
      });
    }

    const canEdit = await BillingService.canUseAIEdit(userId);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        code: "UPGRADE_REQUIRED",
        message: "Your Early Access plan has reached its AI edit limit. Upgrade to continue."
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message || error }
    });
  }
}
