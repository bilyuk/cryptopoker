import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaultRooms } from "../data";
import { UnverifiedFoyer } from "./unverified-foyer";

describe("UnverifiedFoyer", () => {
  it("shows lock/seat readiness copy after escrow funding confirmation", () => {
    const room = {
      ...defaultRooms[0],
      players: [
        {
          playerId: "player-1",
          displayName: "riverrat",
          role: "player" as const,
          seated: false,
          stack: null,
          buyInStatus: "escrow-funded" as const,
        },
      ],
    };

    const html = renderToStaticMarkup(
      <UnverifiedFoyer
        playerName="riverrat"
        room={room}
        currentPlayer={room.players[0]}
        onRequestBuyIn={() => undefined}
        onBackToLobby={() => undefined}
        onInvitePreview={() => undefined}
        onSignOut={() => undefined}
      />,
    );

    expect(html).toContain("Escrowed Buy-In confirmed");
    expect(html).toContain("Ready for lock-before-seat");
    expect(html).not.toContain("Tracer phase complete");
  });
});
