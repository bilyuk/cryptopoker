import {
  authNonceRequestSchema,
  authNonceResponseSchema,
  sessionIssueRequestSchema,
  sessionIssueResponseSchema,
  walletAddressSchema,
  type AuthNonceResponse,
  type SessionIssueResponse
} from "@cryptopoker/api-schema";

export type WalletSessionApiClient = {
  requestNonce: (input: { walletAddress: string }) => Promise<AuthNonceResponse>;
  issueSession: (input: {
    walletAddress: string;
    nonce: string;
    signature: string;
  }) => Promise<SessionIssueResponse>;
  revokeSession?: (input: { accessToken: string }) => Promise<void>;
};

export type WalletSessionClientState = {
  walletAddress: string | null;
  accessToken: string | null;
  sessionId: string | null;
  expiresAt: string | null;
};

export type WalletSigner = (message: string) => Promise<string>;

const MESSAGE_PREFIX = "CryptoPoker login nonce:";

export const formatWalletNonceMessage = (nonce: string) => `${MESSAGE_PREFIX} ${nonce}`;

export const createWalletSessionClient = (api: WalletSessionApiClient) => {
  const state: WalletSessionClientState = {
    walletAddress: null,
    accessToken: null,
    sessionId: null,
    expiresAt: null
  };

  const getState = (): WalletSessionClientState => ({ ...state });

  const connectWallet = async (walletAddress: string, signer: WalletSigner) => {
    const normalizedWalletAddress = walletAddressSchema.parse(walletAddress);
    const nonceRequest = authNonceRequestSchema.parse({ walletAddress: normalizedWalletAddress });
    const nonceResponse = authNonceResponseSchema.parse(await api.requestNonce(nonceRequest));
    const signature = await signer(formatWalletNonceMessage(nonceResponse.nonce));
    const issueRequest = sessionIssueRequestSchema.parse({
      walletAddress: normalizedWalletAddress,
      nonce: nonceResponse.nonce,
      signature
    });
    const sessionResponse = sessionIssueResponseSchema.parse(await api.issueSession(issueRequest));

    state.walletAddress = normalizedWalletAddress;
    state.accessToken = sessionResponse.accessToken;
    state.sessionId = sessionResponse.sessionId;
    state.expiresAt = sessionResponse.expiresAt;

    return sessionResponse;
  };

  const disconnectWallet = async () => {
    if (state.accessToken && api.revokeSession) {
      await api.revokeSession({ accessToken: state.accessToken });
    }
    state.walletAddress = null;
    state.accessToken = null;
    state.sessionId = null;
    state.expiresAt = null;
  };

  const hasValidSession = (now: Date = new Date()) =>
    Boolean(state.accessToken && state.expiresAt && Date.parse(state.expiresAt) > now.getTime());

  return {
    connectWallet,
    disconnectWallet,
    getState,
    hasValidSession
  };
};

