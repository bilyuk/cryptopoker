import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaultRooms } from "../data";
import { InviteScreen } from "./invite-screen";

describe("InviteScreen", () => {
  it("describes the guest-session join state without sign-in copy", () => {
    const html = renderToStaticMarkup(
      <InviteScreen
        playerName="riverrat"
        hostName="Casey"
        room={defaultRooms[0]}
        onJoin={() => undefined}
        onUseDifferentPlayer={() => undefined}
        onBack={() => undefined}
      />,
    );

    expect(html).toContain("Joining as");
    expect(html).toContain("riverrat");
    expect(html).toContain("Use a Different Player");
    expect(html).not.toContain("Sign In to Join");
  });
});
