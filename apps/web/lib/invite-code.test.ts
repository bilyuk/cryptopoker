import { describe, expect, it } from "vitest";
import { readInviteCode } from "./invite-code";

describe("Invite Link entry", () => {
  it("accepts raw Invite Codes and pasted Invite Link URLs", () => {
    expect(readInviteCode("abc123")).toBe("abc123");
    expect(readInviteCode(" https://cryptopoker.local/r/abc123 ")).toBe("abc123");
    expect(readInviteCode("http://localhost:3000/r/abc123?utm=test")).toBe("abc123");
  });

  it("rejects empty or unrelated input", () => {
    expect(readInviteCode("")).toBeUndefined();
    expect(readInviteCode("https://cryptopoker.local/lobby")).toBeUndefined();
  });
});
