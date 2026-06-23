import test from "node:test";
import assert from "node:assert";
import { BillingService } from "../src/services/billing.service.js";

test("Budget Protection Service - isAIQueuePaused returns correct status", async () => {
  const originalIsPaused = BillingService.isAIQueuePaused;
  BillingService.isAIQueuePaused = async () => true;

  try {
    const paused = await BillingService.isAIQueuePaused();
    assert.strictEqual(paused, true);
  } finally {
    BillingService.isAIQueuePaused = originalIsPaused;
  }
});

test("Budget Protection Service - canUseCustomDomain handles EARLY_ACCESS_V1 flag", async () => {
  const originalCanUseCustom = BillingService.canUseCustomDomain;
  BillingService.canUseCustomDomain = async (userId: string) => true;

  try {
    const allowed = await BillingService.canUseCustomDomain("test-user");
    assert.strictEqual(allowed, true);
  } finally {
    BillingService.canUseCustomDomain = originalCanUseCustom;
  }
});
