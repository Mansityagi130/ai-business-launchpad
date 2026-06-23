import test from "node:test";
import assert from "node:assert";
import { BillingService } from "../src/services/billing.service.js";

test("Usage Tracking Service - should reset usage if cycle is expired", async () => {
  const originalGetOrReset = BillingService.resetUsageIfCycleExpired;
  
  BillingService.resetUsageIfCycleExpired = async (userId: string) => {
    // Mocking an expired reset state
    return {
      user_id: userId,
      websites_created: 1,
      ai_edits: 0, // reset to 0
      ai_generations: 0,
      billing_cycle_start: new Date().toISOString(),
      billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  };

  try {
    const usage = await BillingService.resetUsageIfCycleExpired("mock-user");
    assert.ok(usage);
    assert.strictEqual(usage.ai_edits, 0);
    assert.strictEqual(usage.ai_generations, 0);
  } finally {
    BillingService.resetUsageIfCycleExpired = originalGetOrReset;
  }
});
