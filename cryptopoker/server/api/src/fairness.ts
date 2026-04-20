import { createHash } from "node:crypto";
import {
  fairnessCommitRequestSchema,
  fairnessCommitResponseSchema,
  fairnessProofRequestSchema,
  fairnessProofResponseSchema,
  fairnessRevealRequestSchema,
  fairnessRevealResponseSchema,
  type FairnessCommitRequest,
  type FairnessCommitResponse,
  type FairnessProofRequest,
  type FairnessProofResponse,
  type FairnessRevealRequest,
  type FairnessRevealResponse
} from "@cryptopoker/api-schema";

type FairnessRecord = {
  tableId: string;
  handId: string;
  commitment: FairnessCommitResponse | null;
  reveal: FairnessRevealResponse | null;
  finalizedAt: string | null;
  proof: FairnessProofResponse | null;
};

export type FairnessServiceOptions = {
  now?: () => Date;
};

export type FairnessCommitResult =
  | { ok: true; response: FairnessCommitResponse; replayed: boolean }
  | { ok: false; reason: "already_committed" | "already_finalized" };

export type FairnessRevealResult =
  | { ok: true; response: FairnessRevealResponse; replayed: boolean }
  | { ok: false; reason: "commitment_not_found" | "already_revealed" | "already_finalized" };

export type FairnessProofResult =
  | { ok: true; response: FairnessProofResponse }
  | { ok: false; reason: "commitment_not_found" | "reveal_not_found" };

const hashToHex32 = (input: string) => `0x${createHash("sha256").update(input).digest("hex")}`;

export const computeFairnessCommitment = (reveal: string, revealSalt?: string | null) =>
  hashToHex32(`${reveal}:${revealSalt ?? ""}`);

export const createFairnessService = (options: FairnessServiceOptions = {}) => {
  const now = options.now ?? (() => new Date());
  const recordByHandKey = new Map<string, FairnessRecord>();

  const handKey = (tableId: string, handId: string) => `${tableId}:${handId}`;

  const getOrCreateRecord = (tableId: string, handId: string): FairnessRecord => {
    const key = handKey(tableId, handId);
    const existing = recordByHandKey.get(key);
    if (existing) {
      return existing;
    }
    const created: FairnessRecord = {
      tableId,
      handId,
      commitment: null,
      reveal: null,
      finalizedAt: null,
      proof: null
    };
    recordByHandKey.set(key, created);
    return created;
  };

  const commit = (payload: unknown): FairnessCommitResult => {
    const req = fairnessCommitRequestSchema.parse(payload) as FairnessCommitRequest;
    const record = getOrCreateRecord(req.tableId, req.handId);
    if (record.finalizedAt) {
      return { ok: false, reason: "already_finalized" };
    }

    if (record.commitment) {
      if (record.commitment.commitment === req.commitment) {
        return { ok: true, response: record.commitment, replayed: true };
      }
      return { ok: false, reason: "already_committed" };
    }

    const response = fairnessCommitResponseSchema.parse({
      tableId: req.tableId,
      handId: req.handId,
      commitment: req.commitment,
      committedAt: now().toISOString()
    });
    record.commitment = response;
    return { ok: true, response, replayed: false };
  };

  const reveal = (payload: unknown): FairnessRevealResult => {
    const req = fairnessRevealRequestSchema.parse(payload) as FairnessRevealRequest;
    const record = getOrCreateRecord(req.tableId, req.handId);
    if (record.finalizedAt) {
      return { ok: false, reason: "already_finalized" };
    }
    if (!record.commitment) {
      return { ok: false, reason: "commitment_not_found" };
    }

    if (record.reveal) {
      const replayed =
        record.reveal.reveal === req.reveal && (record.reveal.revealSalt ?? null) === (req.revealSalt ?? null);
      if (replayed) {
        return { ok: true, response: record.reveal, replayed: true };
      }
      return { ok: false, reason: "already_revealed" };
    }

    const response = fairnessRevealResponseSchema.parse({
      tableId: req.tableId,
      handId: req.handId,
      reveal: req.reveal,
      revealSalt: req.revealSalt ?? null,
      revealedAt: now().toISOString()
    });
    record.reveal = response;
    return { ok: true, response, replayed: false };
  };

  const getProof = (payload: unknown): FairnessProofResult => {
    const req = fairnessProofRequestSchema.parse(payload) as FairnessProofRequest;
    const record = getOrCreateRecord(req.tableId, req.handId);
    if (!record.commitment) {
      return { ok: false, reason: "commitment_not_found" };
    }
    if (!record.reveal) {
      return { ok: false, reason: "reveal_not_found" };
    }
    if (record.proof) {
      return { ok: true, response: record.proof };
    }

    const computedCommitment = computeFairnessCommitment(record.reveal.reveal, record.reveal.revealSalt);
    const transcriptHash = hashToHex32(
      `${record.tableId}:${record.handId}:${record.commitment.commitment}:${record.reveal.reveal}:${
        record.reveal.revealSalt ?? ""
      }`
    );
    const finalizedAt = now().toISOString();
    record.finalizedAt = finalizedAt;
    record.proof = fairnessProofResponseSchema.parse({
      tableId: record.tableId,
      handId: record.handId,
      commitment: {
        value: record.commitment.commitment,
        committedAt: record.commitment.committedAt
      },
      reveal: {
        value: record.reveal.reveal,
        revealSalt: record.reveal.revealSalt,
        revealedAt: record.reveal.revealedAt
      },
      proof: {
        algorithm: "sha256",
        computedCommitment,
        matchesCommitment: computedCommitment === record.commitment.commitment,
        transcriptHash
      },
      finalizedAt
    });
    return { ok: true, response: record.proof };
  };

  return {
    commit,
    reveal,
    getProof
  };
};
