import { Test } from "@nestjs/testing";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";

describe("Escrow room settlement key delegation", () => {
  it("registers, authorizes, and revokes delegation with host/delegate role boundaries", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const roomId = "room-delegation-a";
      const host = "0x1111111111111111111111111111111111111111";
      const delegate = "0x2222222222222222222222222222222222222222";
      const contract = "0x3333333333333333333333333333333333333333";

      const registered = await request(server)
        .post(`/escrow/rooms/${roomId}/delegations/register`)
        .send({
          hostWalletAddress: host,
          delegateWalletAddress: delegate,
          contractAddress: contract,
          chainId: 8453,
          signerWalletAddress: host,
          signatureDomain: {
            name: "CryptopokerEscrow",
            version: "1",
            chainId: 8453,
            verifyingContract: contract,
          },
          ttlHours: 24,
        })
        .expect(201);

      expect(registered.body.delegation.roomId).toBe(roomId);
      expect(registered.body.delegation.revokedAt).toBeNull();

      const delegateAuth = await request(server)
        .post("/escrow/payouts/authorize")
        .send({
          roomId,
          playerWalletAddress: "0x4444444444444444444444444444444444444444",
          amount: 12,
          nonce: "nonce-1",
          contractAddress: contract,
          chainId: 8453,
          signerWalletAddress: delegate,
        })
        .expect(201);
      expect(delegateAuth.body.authorization.authorizedBy).toBe("delegate");

      const hostAuth = await request(server)
        .post("/escrow/payouts/authorize")
        .send({
          roomId,
          playerWalletAddress: "0x4444444444444444444444444444444444444444",
          amount: 12,
          nonce: "nonce-2",
          contractAddress: contract,
          chainId: 8453,
          signerWalletAddress: host,
        })
        .expect(201);
      expect(hostAuth.body.authorization.authorizedBy).toBe("host");

      await request(server)
        .post(`/escrow/rooms/${roomId}/delegations/revoke`)
        .send({ hostWalletAddress: host, signerWalletAddress: host, reason: "rotation" })
        .expect(201);

      await request(server)
        .post("/escrow/payouts/authorize")
        .send({
          roomId,
          playerWalletAddress: "0x4444444444444444444444444444444444444444",
          amount: 12,
          nonce: "nonce-3",
          contractAddress: contract,
          chainId: 8453,
          signerWalletAddress: delegate,
        })
        .expect(400);
    } finally {
      await app.close();
    }
  });

  it("rejects wrong signer and wrong domain during delegation registration", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const roomId = "room-delegation-b";
      const host = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      const delegate = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
      const contract = "0xcccccccccccccccccccccccccccccccccccccccc";

      await request(server)
        .post(`/escrow/rooms/${roomId}/delegations/register`)
        .send({
          hostWalletAddress: host,
          delegateWalletAddress: delegate,
          contractAddress: contract,
          chainId: 8453,
          signerWalletAddress: delegate,
          signatureDomain: {
            name: "CryptopokerEscrow",
            version: "1",
            chainId: 8453,
            verifyingContract: contract,
          },
        })
        .expect(400);

      await request(server)
        .post(`/escrow/rooms/${roomId}/delegations/register`)
        .send({
          hostWalletAddress: host,
          delegateWalletAddress: delegate,
          contractAddress: contract,
          chainId: 8453,
          signerWalletAddress: host,
          signatureDomain: {
            name: "CryptopokerEscrow",
            version: "1",
            chainId: 8453,
            verifyingContract: "0xdddddddddddddddddddddddddddddddddddddddd",
          },
        })
        .expect(400);
    } finally {
      await app.close();
    }
  });

  it("rejects expired, wrong-room, and wrong-contract payout delegation usage", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const roomId = "room-delegation-c";
      const host = "0x1212121212121212121212121212121212121212";
      const delegate = "0x3434343434343434343434343434343434343434";
      const contract = "0x5656565656565656565656565656565656565656";

      await request(server)
        .post(`/escrow/rooms/${roomId}/delegations/register`)
        .send({
          hostWalletAddress: host,
          delegateWalletAddress: delegate,
          contractAddress: contract,
          chainId: 8453,
          signerWalletAddress: host,
          signatureDomain: {
            name: "CryptopokerEscrow",
            version: "1",
            chainId: 8453,
            verifyingContract: contract,
          },
          ttlHours: 1,
          issuedAt: "2000-01-01T00:00:00.000Z",
        })
        .expect(400);

      await request(server)
        .post(`/escrow/rooms/${roomId}/delegations/register`)
        .send({
          hostWalletAddress: host,
          delegateWalletAddress: delegate,
          contractAddress: contract,
          chainId: 8453,
          signerWalletAddress: host,
          signatureDomain: {
            name: "CryptopokerEscrow",
            version: "1",
            chainId: 8453,
            verifyingContract: contract,
          },
          ttlHours: 24,
        })
        .expect(201);

      await request(server)
        .post("/escrow/payouts/authorize")
        .send({
          roomId: "room-other",
          playerWalletAddress: "0x7777777777777777777777777777777777777777",
          amount: 20,
          nonce: "nonce-wrong-room",
          contractAddress: contract,
          chainId: 8453,
          signerWalletAddress: delegate,
        })
        .expect(400);

      await request(server)
        .post("/escrow/payouts/authorize")
        .send({
          roomId,
          playerWalletAddress: "0x7777777777777777777777777777777777777777",
          amount: 20,
          nonce: "nonce-wrong-contract",
          contractAddress: "0x8888888888888888888888888888888888888888",
          chainId: 8453,
          signerWalletAddress: delegate,
        })
        .expect(400);
    } finally {
      await app.close();
    }
  });
});
