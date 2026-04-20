import {
  authNonceResponseSchema,
  sessionIssueResponseSchema,
  type AuthNonceResponse,
  type SessionIssueResponse
} from "@cryptopoker/api-schema";
export {
  createTableSessionClient,
  type CreateTableSessionClientInput,
  type TableEventsResponse,
  type TableSessionApiClient,
  type TableSessionClientState
} from "./table-session.js";
export {
  createWalletSessionClient,
  formatWalletNonceMessage,
  type WalletSessionApiClient,
  type WalletSessionClientState,
  type WalletSigner
} from "./wallet-session.js";

export type SessionBootstrap = {
  noncePayload: AuthNonceResponse;
  sessionPayload: SessionIssueResponse;
};

export const parseSessionBootstrap = (payload: SessionBootstrap): SessionBootstrap => ({
  noncePayload: authNonceResponseSchema.parse(payload.noncePayload),
  sessionPayload: sessionIssueResponseSchema.parse(payload.sessionPayload)
});
