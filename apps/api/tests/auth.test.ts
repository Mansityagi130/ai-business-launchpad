import test from "node:test";
import assert from "node:assert";
import { requireAuth, AuthenticatedRequest } from "../src/middleware/auth.middleware.js";
import { AuthService } from "../src/services/auth.service.js";

// Mock Express req, res, and next objects
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

test("Auth Middleware - should block request with 401 when Authorization header is missing", async () => {
  const req: any = { headers: {} };
  const res = createMockResponse();
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await requireAuth(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.jsonData.success, false);
  assert.strictEqual(res.jsonData.error.code, "UNAUTHORIZED");
  assert.strictEqual(nextCalled, false);
});

test("Auth Middleware - should block request with 401 when Bearer scheme is missing", async () => {
  const req: any = { headers: { authorization: "Token invalidtoken" } };
  const res = createMockResponse();
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await requireAuth(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.jsonData.success, false);
  assert.strictEqual(nextCalled, false);
});

test("Auth Middleware - should attach user and pass when token is verified successfully", async () => {
  const originalVerifyToken = AuthService.verifyToken;
  
  AuthService.verifyToken = async (token: string) => {
    return { id: "test-user-id", email: "test@example.com" } as any;
  };

  const req: any = { headers: { authorization: "Bearer valid-mock-token" } };
  const res = createMockResponse();
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  try {
    await requireAuth(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.id, "test-user-id");
    assert.strictEqual(req.user.email, "test@example.com");
  } finally {
    // Restore original verifyToken method
    AuthService.verifyToken = originalVerifyToken;
  }
});
