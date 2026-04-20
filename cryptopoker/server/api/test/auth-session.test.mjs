import assert from "node:assert/strict";
import test from "node:test";
import { createWalletAuthSessionService } from "../dist/auth-session.js";

const WALLET = "0x1234567890abcdef1234567890abcdef12345678";

test("issues, verifies, and expires sessions", async () => {
  let nowMs = Date.parse("2026-01-01T00:00:00.000Z");
  const auditLog = [];
  const service = createWalletAuthSessionService({
    sessionSecret: "test-secret",
    nonceTtlSeconds: 30,
    sessionTtlSeconds: 10,
    now: () => new Date(nowMs),
    verifySignature: async ({ signature, walletAddress, nonce }) =>
      signature === `sig:${walletAddress}:${nonce}`,
    onAuditLog: (entry) => auditLog.push(entry)
  });

  const nonceResponse = service.requestNonce({ walletAddress: WALLET });
  const issuance = await service.issueSession({
    walletAddress: WALLET,
    nonce: nonceResponse.nonce,
    signature: `sig:${WALLET}:${nonceResponse.nonce}`
  });

  assert.equal(issuance.ok, true);
  assert.equal(service.verifySessionToken(issuance.response.accessToken).ok, true);

  nowMs += 11_000;
  const expired = service.verifySessionToken(issuance.response.accessToken);
  assert.deepEqual(expired, { ok: false, reason: "session_expired" });
  assert.equal(auditLog.at(-1)?.reason, "ok");
});

test("rejects reused nonces and revoked sessions", async () => {
  const service = createWalletAuthSessionService({
    sessionSecret: "test-secret",
    verifySignature: async ({ signature, walletAddress, nonce }) =>
      signature === `sig:${walletAddress}:${nonce}`
  });

  const nonceResponse = service.requestNonce({ walletAddress: WALLET });
  const firstIssue = await service.issueSession({
    walletAddress: WALLET,
    nonce: nonceResponse.nonce,
    signature: `sig:${WALLET}:${nonceResponse.nonce}`
  });
  assert.equal(firstIssue.ok, true);

  const secondIssue = await service.issueSession({
    walletAddress: WALLET,
    nonce: nonceResponse.nonce,
    signature: `sig:${WALLET}:${nonceResponse.nonce}`
  });
  assert.deepEqual(secondIssue, { ok: false, reason: "nonce_reused" });

  const revoked = service.revokeSession(firstIssue.response.accessToken);
  assert.equal(revoked.ok, true);
  assert.deepEqual(service.verifySessionToken(firstIssue.response.accessToken), {
    ok: false,
    reason: "session_revoked"
  });
});
