import type { Room } from "../types";
import { TableView } from "./table-view";
import { UnverifiedFoyer } from "./unverified-foyer";
import { WaitlistFoyer } from "./waitlist-foyer";

type RoomScreenProps = {
  playerId?: string;
  playerName: string;
  room: Room;
  onBackToLobby: () => void;
  onDeal: () => void;
  onExpireBuyIn: (buyInId: string) => void;
  onRefundBuyIn: (buyInId: string) => void;
  onLeaveSeat: () => void;
  onInvitePreview: () => void;
  onCopyInvite: () => void;
  onRequestBuyIn: (amount: number) => Promise<void> | void;
  onLeaveWaitlist: () => void;
  onAcceptSeatOffer: (seatOfferId: string) => void;
  onDeclineSeatOffer: (seatOfferId: string) => void;
  onShareInvite: () => void;
  inviteActionMessage?: string;
  onSignOut: () => void;
};

export function RoomScreen(props: RoomScreenProps) {
  const { room, playerId } = props;
  const isHost = playerId === room.hostPlayerId;
  const currentPlayer = room.players.find((player) => player.playerId === playerId);
  const isSeated = currentPlayer?.seated ?? false;
  const status = currentPlayer?.buyInStatus ?? "none";

  if (!isSeated && status !== "escrow-funded" && status !== "in-play") {
    return (
      <UnverifiedFoyer
        playerName={props.playerName}
        room={room}
        currentPlayer={currentPlayer}
        onRequestBuyIn={props.onRequestBuyIn}
        onBackToLobby={props.onBackToLobby}
        onInvitePreview={props.onInvitePreview}
        onSignOut={props.onSignOut}
      />
    );
  }

  if (!isSeated && (status === "escrow-funded" || status === "in-play")) {
    const position = room.currentPlayerWaitlistPosition ?? 1;
    return (
      <WaitlistFoyer
        playerName={props.playerName}
        room={room}
        position={position}
        onLeaveWaitlist={props.onLeaveWaitlist}
        onAcceptSeatOffer={props.onAcceptSeatOffer}
        onDeclineSeatOffer={props.onDeclineSeatOffer}
        onBackToLobby={props.onBackToLobby}
        onInvitePreview={props.onInvitePreview}
        onSignOut={props.onSignOut}
      />
    );
  }

  return (
    <TableView
      playerName={props.playerName}
      room={room}
      isHost={isHost}
      isSeated={isSeated}
      onExpireBuyIn={props.onExpireBuyIn}
      onRefundBuyIn={props.onRefundBuyIn}
      onLeaveSeat={props.onLeaveSeat}
      onLeaveRoom={props.onBackToLobby}
      onDeal={props.onDeal}
      onCopyInvite={props.onCopyInvite}
      onShareInvite={props.onShareInvite}
      onInvitePreview={props.onInvitePreview}
      onSignOut={props.onSignOut}
      inviteActionMessage={props.inviteActionMessage}
    />
  );
}
