import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  authAuditLogSchema,
  authFailureReasonSchema,
  authNonceRequestSchema,
  authNonceResponseSchema,
  sessionIssueRequestSchema,
  sessionIssueResponseSchema,
  type AuthAuditLog,
  type AuthFailureReason,
  type AuthNonceRequest,
  type AuthNonceResponse,
  type SessionIssueRequest,
  type SessionIssueResponse
} from "@cryptopoker/api-schema";
import {
  createNoopObservability,
  runWithSpan,
  runWithSpanAsync,
  type ServiceObservability
} from "./observability.js";

type SessionRecord = {
  sessionId: string;
  walletAddress: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

type NonceRecord = {
  walletAddress: string;
  nonce: string;
  expiresAt: string;
  consumedAt: string | null;
};

type ReconnectRecord = {
  walletAddress: string;
  issuedAtMs: number[];
};

export type SessionVerification = {
  ok: true;
  session: SessionRecord;
} | {
  ok: false;
  reason: AuthFailureReason;
};

export type SessionIssuance = {
  ok: true;
  response: SessionIssueResponse;
} | {
  ok: false;
  reason: AuthFailureReason;
};

export type WalletSignatureVerifier = (input: SessionIssueRequest) => boolean | Promise<boolean>;

export type WalletAuthSessionServiceOptions = {
  sessionSecret: string;
  nonceTtlSeconds?: number;
  sessionTtlSeconds?: number;
  reconnectWindowSeconds?: number;
  reconnectThreshold?: number;
  now?: () => Date;
  verifySignature?: WalletSignatureVerifier;
  onAuditLog?: (entry: AuthAuditLog) => void;
  observability?: ServiceObservability;
};

const DEFAULT_NONCE_TTL_SECONDS = 300;
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24;
const DEFAULT_RECONNECT_WINDOW_SECONDS = 60;
const DEFAULT_RECONNECT_THRESHOLD = 5;

const asIso = (ms: number) => new Date(ms).toISOString();

const createNonce = () => `cp-${randomBytes(16).toString("hex")}`;

const base64UrlEncode = (value: string) => Buffer.from(value, "utf8").toString("base64url");

const base64UrlDecode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const tokenSignature = (sessionSecret: string, payload: string) =>
  createHmac("sha256", sessionSecret).update(payload).digest("base64url");

export const createWalletAuthSessionService = (options: WalletAuthSessionServiceOptions) => {
  const nonceTtlSeconds = options.nonceTtlSeconds ?? DEFAULT_NONCE_TTL_SECONDS;
  const sessionTtlSeconds = options.sessionTtlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;
  const reconnectWindowSeconds = options.reconnectWindowSeconds ?? DEFAULT_RECONNECT_WINDOW_SECONDS;
  const reconnectThreshold = options.reconnectThreshold ?? DEFAULT_RECONNECT_THRESHOLD;
  const now = options.now ?? (() => new Date());
  const verifySignature = options.verifySignature ?? (async () => false);
  const observability = options.observability ?? createNoopObservability();

  const nonceByWalletAndValue = new Map<string, NonceRecord>();
  const sessionById = new Map<string, SessionRecord>();
  const tokenToSessionId = new Map<string, string>();
  const reconnectByWallet = new Map<string, ReconnectRecord>();

  const emitAuditLog = (entry: AuthAuditLog) => {
    const validated = authAuditLogSchema.parse(entry);
    options.onAuditLog?.(validated);
  };

  const recordFailure = (
    walletAddress: string,
    reason: AuthFailureReason,
    sessionId: string | null = null
  ): SessionVerification => {
    const failureReason = authFailureReasonSchema.parse(reason);
    observability.observeAuthResult(false, failureReason);
    emitAuditLog({
      walletAddress,
      sessionId,
      success: false,
      reason: failureReason,
      occurredAt: now().toISOString()
    });
    return { ok: false, reason: failureReason };
  };

  const recordIssueFailure = (
    walletAddress: string,
    reason: AuthFailureReason,
    sessionId: string | null = null
  ): SessionIssuance => {
    const failureReason = authFailureReasonSchema.parse(reason);
    recordFailure(walletAddress, failureReason, sessionId);
    return { ok: false, reason: failureReason };
  };

  const nonceKey = (walletAddress: string, nonce: string) => `${walletAddress}:${nonce}`;

  const getSessionFromToken = (accessToken: string): SessionVerification => {
    const tokenSegments = accessToken.split(".");
    if (tokenSegments.length !== 3 || tokenSegments[0] !== "v1") {
      return { ok: false, reason: "token_invalid" };
    }
    const payloadEncoded = tokenSegments[1];
    const signature = tokenSegments[2];
    const expectedSignature = tokenSignature(options.sessionSecret, payloadEncoded);

    try {
      if (
        signature.length !== expectedSignature.length ||
        !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
      ) {
        return { ok: false, reason: "token_invalid" };
      }
      const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as {
        sessionId: string;
      };
      const session = sessionById.get(payload.sessionId);
      if (!session) {
        return { ok: false, reason: "session_missing" };
      }
      const nowMs = now().getTime();
      if (session.revokedAt) {
        return { ok: false, reason: "session_revoked" };
      }
      if (Date.parse(session.expiresAt) <= nowMs) {
        return { ok: false, reason: "session_expired" };
      }
      return { ok: true, session };
    } catch {
      return { ok: false, reason: "token_invalid" };
    }
  };

  const requestNonce = (payload: unknown): AuthNonceResponse => {
    return runWithSpan(observability, "auth.request_nonce", undefined, () => {
      const req = authNonceRequestSchema.parse(payload) as AuthNonceRequest;
      const nonce = createNonce();
      const currentMs = now().getTime();
      const expiresAt = asIso(currentMs + nonceTtlSeconds * 1000);
      nonceByWalletAndValue.set(nonceKey(req.walletAddress, nonce), {
        walletAddress: req.walletAddress,
        nonce,
        expiresAt,
        consumedAt: null
      });
      return authNonceResponseSchema.parse({ nonce, expiresAt });
    });
  };

  const issueSession = async (payload: unknown): Promise<SessionIssuance> => {
    return runWithSpanAsync(observability, "auth.issue_session", undefined, async () => {
      const req = sessionIssueRequestSchema.parse(payload) as SessionIssueRequest;
      const nonceRecord = nonceByWalletAndValue.get(nonceKey(req.walletAddress, req.nonce));
      if (!nonceRecord) {
        return recordIssueFailure(req.walletAddress, "nonce_not_found");
      }
      const nowMs = now().getTime();
      if (nonceRecord.consumedAt) {
        return recordIssueFailure(req.walletAddress, "nonce_reused");
      }
      if (Date.parse(nonceRecord.expiresAt) <= nowMs) {
        return recordIssueFailure(req.walletAddress, "nonce_expired");
      }
      const signatureIsValid = await verifySignature(req);
      if (!signatureIsValid) {
        return recordIssueFailure(req.walletAddress, "signature_invalid");
      }
      nonceRecord.consumedAt = now().toISOString();
      const sessionId = randomUUID();
      const sessionRecord: SessionRecord = {
        sessionId,
        walletAddress: req.walletAddress,
        issuedAt: now().toISOString(),
        expiresAt: asIso(nowMs + sessionTtlSeconds * 1000),
        revokedAt: null
      };
      sessionById.set(sessionRecord.sessionId, sessionRecord);

      const payloadEncoded = base64UrlEncode(JSON.stringify({ sessionId: sessionRecord.sessionId }));
      const signature = tokenSignature(options.sessionSecret, payloadEncoded);
      const accessToken = `v1.${payloadEncoded}.${signature}`;
      tokenToSessionId.set(accessToken, sessionRecord.sessionId);

      const reconnectRecord =
        reconnectByWallet.get(req.walletAddress) ??
        ({ walletAddress: req.walletAddress, issuedAtMs: [] } as ReconnectRecord);
      reconnectRecord.issuedAtMs.push(nowMs);
      const windowStart = nowMs - reconnectWindowSeconds * 1000;
      reconnectRecord.issuedAtMs = reconnectRecord.issuedAtMs.filter((ts) => ts >= windowStart);
      reconnectByWallet.set(req.walletAddress, reconnectRecord);
      if (reconnectRecord.issuedAtMs.length >= reconnectThreshold) {
        emitAuditLog({
          walletAddress: req.walletAddress,
          sessionId: sessionRecord.sessionId,
          success: true,
          reason: "suspicious_reconnect",
          occurredAt: now().toISOString()
        });
      }

      observability.observeAuthResult(true, "ok");
      emitAuditLog({
        walletAddress: req.walletAddress,
        sessionId: sessionRecord.sessionId,
        success: true,
        reason: "ok",
        occurredAt: now().toISOString()
      });

      return {
        ok: true,
        response: sessionIssueResponseSchema.parse({
          accessToken,
          sessionId: sessionRecord.sessionId,
          expiresAt: sessionRecord.expiresAt
        })
      };
    });
  };

  const verifySessionToken = (accessToken: string): SessionVerification => {
    return runWithSpan(observability, "auth.verify_session_token", undefined, () => {
      const verification = getSessionFromToken(accessToken);
      if (!verification.ok) {
        return verification;
      }
      return verification;
    });
  };

  const verifyBearerHeader = (authorizationHeader: string | null | undefined): SessionVerification => {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return { ok: false, reason: "token_invalid" };
    }
    return verifySessionToken(authorizationHeader.slice("Bearer ".length).trim());
  };

  const revokeSession = (accessToken: string): SessionVerification => {
    return runWithSpan(observability, "auth.revoke_session", undefined, () => {
      const verification = getSessionFromToken(accessToken);
      if (!verification.ok) {
        return verification;
      }
      verification.session.revokedAt = now().toISOString();
      const sessionId = tokenToSessionId.get(accessToken);
      if (sessionId) {
        tokenToSessionId.delete(accessToken);
      }
      emitAuditLog({
        walletAddress: verification.session.walletAddress,
        sessionId: verification.session.sessionId,
        success: true,
        reason: "session_revoked",
        occurredAt: now().toISOString()
      });
      return verification;
    });
  };

  const pruneExpiredState = () => {
    const nowMs = now().getTime();
    for (const [key, nonceRecord] of nonceByWalletAndValue.entries()) {
      if (Date.parse(nonceRecord.expiresAt) <= nowMs || nonceRecord.consumedAt) {
        nonceByWalletAndValue.delete(key);
      }
    }
    for (const [sessionId, sessionRecord] of sessionById.entries()) {
      if (sessionRecord.revokedAt || Date.parse(sessionRecord.expiresAt) <= nowMs) {
        sessionById.delete(sessionId);
      }
    }
  };

  return {
    requestNonce,
    issueSession,
    verifySessionToken,
    verifyBearerHeader,
    revokeSession,
    pruneExpiredState
  };
};
