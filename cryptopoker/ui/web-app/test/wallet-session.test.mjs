import assert from "node:assert/strict";
import test from "node:test";
import { createWalletSessionClient, formatWalletNonceMessage } from "../dist/wallet-session.js";

const WALLET = "0x1234567890abcdef1234567890abcdef12345678";

test("connects and disconnects wallet session", async () => {
  const calls = [];
  const client = createWalletSessionClient({
    requestNonce: async ({ walletAddress }) => {
      calls.push({ type: "requestNonce", walletAddress });
      return {
        nonce: "nonce-123",
        expiresAt: "2026-01-01T00:01:00.000Z"
      };
    },
    issueSession: async ({ walletAddress, nonce, signature }) => {
      calls.push({ type: "issueSession", walletAddress, nonce, signature });
      return {
        accessToken: "v1.token.sig",
        sessionId: "3adf383f-53f4-403f-bf2f-1064f4d53a82",
        expiresAt: "2099-01-01T00:01:00.000Z"
      };
    },
    revokeSession: async ({ accessToken }) => {
      calls.push({ type: "revokeSession", accessToken });
    }
  });

  const signer = async (message) => {
    assert.equal(message, formatWalletNonceMessage("nonce-123"));
    return "signed-message";
  };

  const session = await client.connectWallet(WALLET, signer);
  assert.equal(session.sessionId, "3adf383f-53f4-403f-bf2f-1064f4d53a82");
  assert.equal(client.getState().walletAddress, WALLET);
  assert.equal(client.hasValidSession(), true);

  await client.disconnectWallet();
  assert.equal(client.getState().walletAddress, null);
  assert.equal(client.hasValidSession(), false);
  assert.deepEqual(
    calls.map((entry) => entry.type),
    ["requestNonce", "issueSession", "revokeSession"]
  );
});
