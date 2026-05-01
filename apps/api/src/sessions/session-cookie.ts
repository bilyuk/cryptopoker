import { SESSION_COOKIE_NAME } from "@cryptopoker/contracts";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function createSessionCookie(sessionId: string): string {
  return `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readSessionCookie(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === SESSION_COOKIE_NAME) {
      return valueParts.join("=");
    }
  }

  return undefined;
}
