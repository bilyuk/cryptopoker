export function readInviteCode(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    const [, prefix, code] = url.pathname.split("/");
    return prefix === "r" && code ? code : undefined;
  } catch {
    return trimmed.includes("/") ? undefined : trimmed;
  }
}
