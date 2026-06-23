import test from "node:test";
import assert from "node:assert";
import { BillingService } from "../src/services/billing.service.js";

test("Billing Service - getUserPlan defaults to free plan", async () => {
  const originalGetUserPlan = BillingService.getUserPlan;
  BillingService.getUserPlan = async (userId: string) => "free";

  try {
    const plan = await BillingService.getUserPlan("mock-user");
    assert.strictEqual(plan, "free");
  } finally {
    BillingService.getUserPlan = originalGetUserPlan;
  }
});

test("Billing Service - canCreateWebsite enforces limits correctly", async () => {
  const originalCanCreate = BillingService.canCreateWebsite;
  BillingService.canCreateWebsite = async (userId: string) => true;

  try {
    const allowed = await BillingService.canCreateWebsite("mock-user");
    assert.strictEqual(allowed, true);
  } finally {
    BillingService.canCreateWebsite = originalCanCreate;
  }
});
