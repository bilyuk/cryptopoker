import type { PlayerDto, RoomDto } from "@cryptopoker/contracts";
import type { Room, RoomBuyInSummary, RoomPlayerSummary, RoomSeatLabel } from "@/components/aurum/types";

export function toUiRoom(room: RoomDto): Room {
  const occupiedSeats = room.seats.filter((seat) => seat.playerId).length;
  const host = room.players.find((player) => player.playerId === room.hostPlayerId);
  return {
    id: room.id,
    inviteCode: room.inviteCode,
    hostPlayerId: room.hostPlayerId,
    hostName: host?.displayName ?? "Host",
    name: room.settings.name,
    variant: "No Limit Hold'em",
    blinds: `$${room.settings.smallBlind}/$${room.settings.bigBlind}`,
    buyIn: `$${room.settings.buyInMin}-$${room.settings.buyInMax}`,
    buyInMinValue: room.settings.buyInMin,
    seats: `${occupiedSeats}/${room.settings.seatCount}`,
    occupiedSeats,
    seatCount: room.settings.seatCount,
    seatLabels: room.seats.map((seat): RoomSeatLabel => {
      const player = seat.playerId ? room.players.find((candidate) => candidate.playerId === seat.playerId) : undefined;
      return {
        label: player ? formatSeatPlayer(player, room.hostPlayerId) : `Seat ${seat.seatNumber} - waiting...`,
        stack: seat.tableStack === null ? null : `$${seat.tableStack.toFixed(2)}`,
      };
    }),
    players: room.players.map((player): RoomPlayerSummary => {
      const seat = room.seats.find((candidate) => candidate.playerId === player.playerId);
      const buyIn = bestBuyInForPlayer(room, player.playerId);
      return {
        playerId: player.playerId,
        displayName: player.displayName,
        role: player.role,
        seated: Boolean(seat),
        stack: seat?.tableStack === null || seat?.tableStack === undefined ? null : `$${seat.tableStack.toFixed(2)}`,
        buyInStatus: buyIn?.status ?? "none",
        buyInId: buyIn?.id,
      };
    }),
    pendingBuyIns: room.buyIns
      .filter((buyIn) => buyIn.status === "pending")
      .map((buyIn): RoomBuyInSummary => {
        const player = room.players.find((candidate) => candidate.playerId === buyIn.playerId);
        return {
          id: buyIn.id,
          playerId: buyIn.playerId,
          displayName: player?.displayName ?? "Player",
          amount: `$${buyIn.amount.toFixed(2)}`,
        };
      }),
    openSeatNumbers: room.seats.filter((seat) => !seat.playerId).map((seat) => seat.seatNumber),
    timer: `${room.settings.actionTimerSeconds}s`,
    featured: true,
    private: true,
    status: occupiedSeats >= room.settings.seatCount ? "Full" : "Seats open",
    full: occupiedSeats >= room.settings.seatCount,
  };
}

function formatSeatPlayer(player: { playerId: PlayerDto["id"]; displayName: PlayerDto["displayName"] }, hostPlayerId: PlayerDto["id"]): string {
  return player.playerId === hostPlayerId ? `${player.displayName} · host` : player.displayName;
}

function bestBuyInForPlayer(room: RoomDto, playerId: PlayerDto["id"]) {
  const playerBuyIns = room.buyIns.filter((buyIn) => buyIn.playerId === playerId);
  return (
    playerBuyIns.find((buyIn) => buyIn.status === "host-verified") ??
    playerBuyIns.find((buyIn) => buyIn.status === "pending") ??
    playerBuyIns.find((buyIn) => buyIn.status === "rejected")
  );
}
