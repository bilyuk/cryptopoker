import { describe, expect, it, vi } from "vitest";
import { buildInviteUrl, copyInviteLink, shareInviteLink } from "./invite-actions";

describe("Invite Link actions", () => {
  it("copies the Room Invite Link without requiring navigation", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);

    const result = await copyInviteLink({
      origin: "http://localhost:3000",
      inviteCode: "abc123",
      clipboard: { writeText },
    });

    expect(result).toEqual({ ok: true, message: "Invite link copied." });
    expect(writeText).toHaveBeenCalledWith("http://localhost:3000/r/abc123");
  });

  it("shares when browser share is available and falls back to copy otherwise", async () => {
    const share = vi.fn<(data: { title: string; url: string }) => Promise<void>>().mockResolvedValue(undefined);
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);

    await expect(
      shareInviteLink({
        origin: "https://cryptopoker.local",
        inviteCode: "abc123",
        roomName: "Gilt Room",
        share,
        clipboard: { writeText },
      }),
    ).resolves.toEqual({ ok: true, message: "Invite link shared." });
    expect(share).toHaveBeenCalledWith({ title: "Join Gilt Room on CryptoPoker", url: "https://cryptopoker.local/r/abc123" });
    expect(writeText).not.toHaveBeenCalled();

    await expect(
      shareInviteLink({
        origin: "https://cryptopoker.local",
        inviteCode: "abc123",
        roomName: "Gilt Room",
        clipboard: { writeText },
      }),
    ).resolves.toEqual({ ok: true, message: "Invite link copied." });
    expect(writeText).toHaveBeenCalledWith(buildInviteUrl("https://cryptopoker.local", "abc123"));
  });

  it("returns failure feedback when copying is denied", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockRejectedValue(new Error("denied"));

    await expect(
      copyInviteLink({
        origin: "http://localhost:3000",
        inviteCode: "abc123",
        clipboard: { writeText },
      }),
    ).resolves.toEqual({ ok: false, message: "Invite link could not be copied." });
  });
});
