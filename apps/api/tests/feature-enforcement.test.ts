import test from "node:test";
import assert from "node:assert";
import { enforceWebsiteLimit, enforceAIEditLimit } from "../src/middleware/billing.middleware.js";
import { BillingService } from "../src/services/billing.service.js";

function createMockResponse() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  return res;
}

test("Feature Enforcement Middleware - Website limit blocks with UPGRADE_REQUIRED", async () => {
  const originalCanCreate = BillingService.canCreateWebsite;
  BillingService.canCreateWebsite = async (userId: string) => false;

  const req: any = { user: { id: "test-user" } };
  const res = createMockResponse();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  try {
    await enforceWebsiteLimit(req, res, next);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonData.code, "UPGRADE_REQUIRED");
  } finally {
    BillingService.canCreateWebsite = originalCanCreate;
  }
});

test("Feature Enforcement Middleware - AI edit limit blocks with UPGRADE_REQUIRED", async () => {
  const originalCanEdit = BillingService.canUseAIEdit;
  BillingService.canUseAIEdit = async (userId: string) => false;

  const req: any = { user: { id: "test-user" } };
  const res = createMockResponse();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  try {
    await enforceAIEditLimit(req, res, next);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonData.code, "UPGRADE_REQUIRED");
  } finally {
    BillingService.canUseAIEdit = originalCanEdit;
  }
});
