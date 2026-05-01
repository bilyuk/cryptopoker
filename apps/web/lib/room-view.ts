import type { PlayerDto, RoomDto } from "@cryptopoker/contracts";
import type { Room, RoomSeatLabel } from "@/components/aurum/types";

export function toUiRoom(room: RoomDto): Room {
  const occupiedSeats = room.seats.filter((seat) => seat.playerId).length;
  return {
    id: room.id,
    inviteCode: room.inviteCode,
    name: room.settings.name,
    variant: "No Limit Hold'em",
    blinds: `$${room.settings.smallBlind}/$${room.settings.bigBlind}`,
    buyIn: `$${room.settings.buyInMin}-$${room.settings.buyInMax}`,
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
