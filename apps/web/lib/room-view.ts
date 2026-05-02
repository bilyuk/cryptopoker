import type { PlayerDto, RoomDto } from "@cryptopoker/contracts";
import type {
  Room,
  RoomBuyInSummary,
  RoomPlayerSummary,
  RoomSeatRosterEntry,
  RoomWaitlistEntry,
} from "@/components/aurum/types";
import { formatMoney } from "./format";

export function toUiRoomForPlayer(room: RoomDto, currentPlayerId?: PlayerDto["id"]): Room {
  const occupiedSeats = room.seats.filter((seat) => seat.playerId).length;
  const host = room.players.find((player) => player.playerId === room.hostPlayerId);
  const waitlistEntry = currentPlayerId ? room.waitlist.find((entry) => entry.playerId === currentPlayerId) : undefined;
  const pendingSeatOffer = currentPlayerId
    ? room.seatOffers.find((offer) => offer.playerId === currentPlayerId && offer.status === "pending")
    : undefined;
  return {
    id: room.id,
    inviteCode: room.inviteCode,
    hostPlayerId: room.hostPlayerId,
    hasStarted: room.hasStarted,
    hostName: host?.displayName ?? "Host",
    name: room.settings.name,
    variant: "No Limit Hold'em",
    blinds: `$${room.settings.smallBlind}/$${room.settings.bigBlind}`,
    buyIn: `$${room.settings.buyInMin}-$${room.settings.buyInMax}`,
    buyInRange: { min: room.settings.buyInMin, max: room.settings.buyInMax },
    seats: `${occupiedSeats}/${room.settings.seatCount}`,
    occupiedSeats,
    seatCount: room.settings.seatCount,
    seatRoster: room.seats.map((seat): RoomSeatRosterEntry => {
      const player = seat.playerId ? room.players.find((candidate) => candidate.playerId === seat.playerId) : undefined;
      return {
        seatNumber: seat.seatNumber,
        playerId: seat.playerId,
        displayName: player?.displayName ?? null,
        isHost: Boolean(player && player.playerId === room.hostPlayerId),
        stack: seat.tableStack === null ? null : formatMoney(seat.tableStack),
      };
    }),
    waitlistRoster: room.waitlist.map((entry): RoomWaitlistEntry => {
      const player = room.players.find((candidate) => candidate.playerId === entry.playerId);
      return {
        position: entry.position,
        playerId: entry.playerId,
        displayName: player?.displayName ?? "Player",
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
        stack: seat?.tableStack === null || seat?.tableStack === undefined ? null : formatMoney(seat.tableStack),
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
          amount: formatMoney(buyIn.amount),
        };
      }),
    openSeatNumbers: room.seats.filter((seat) => !seat.playerId).map((seat) => seat.seatNumber),
    currentPlayerWaitlistPosition: waitlistEntry?.position,
    currentPlayerSeatOffer: pendingSeatOffer
      ? {
          id: pendingSeatOffer.id,
          seatNumber: pendingSeatOffer.seatNumber,
        }
      : undefined,
    timer: `${room.settings.actionTimerSeconds}s`,
    featured: true,
    private: true,
    status: occupiedSeats >= room.settings.seatCount ? "Full" : "Seats open",
    full: occupiedSeats >= room.settings.seatCount,
  };
}

export function isCurrentPlayerInRoom(room: Room, playerId: string | undefined): boolean {
  if (!playerId) return false;
  return room.players.some((player) => player.playerId === playerId);
}

function bestBuyInForPlayer(room: RoomDto, playerId: PlayerDto["id"]) {
  const playerBuyIns = room.buyIns.filter((buyIn) => buyIn.playerId === playerId);
  return (
    playerBuyIns.find((buyIn) => buyIn.status === "host-verified") ??
    playerBuyIns.find((buyIn) => buyIn.status === "pending") ??
    playerBuyIns.find((buyIn) => buyIn.status === "rejected")
  );
}
