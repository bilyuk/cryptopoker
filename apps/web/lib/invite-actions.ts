type ClipboardWriter = {
  writeText(text: string): Promise<void>;
};

type InviteActionResult = {
  ok: boolean;
  message: string;
};

export function buildInviteUrl(origin: string, inviteCode: string): string {
  return `${origin.replace(/\/$/, "")}/r/${inviteCode}`;
}

export async function copyInviteLink({
  origin,
  inviteCode,
  clipboard,
}: {
  origin: string;
  inviteCode: string;
  clipboard?: ClipboardWriter;
}): Promise<InviteActionResult> {
  if (!clipboard) return { ok: false, message: "Clipboard is not available." };

  try {
    await clipboard.writeText(buildInviteUrl(origin, inviteCode));
    return { ok: true, message: "Invite link copied." };
  } catch {
    return { ok: false, message: "Invite link could not be copied." };
  }
}

export async function shareInviteLink({
  origin,
  inviteCode,
  roomName,
  share,
  clipboard,
}: {
  origin: string;
  inviteCode: string;
  roomName: string;
  share?: (data: { title: string; url: string }) => Promise<void>;
  clipboard?: ClipboardWriter;
}): Promise<InviteActionResult> {
  const url = buildInviteUrl(origin, inviteCode);

  if (share) {
    try {
      await share({ title: `Join ${roomName} on CryptoPoker`, url });
      return { ok: true, message: "Invite link shared." };
    } catch {
      return copyInviteLink({ origin, inviteCode, clipboard });
    }
  }

  return copyInviteLink({ origin, inviteCode, clipboard });
}
