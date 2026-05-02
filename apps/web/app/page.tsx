"use client";

import { useEffect } from "react";
import { API_HEALTH_PATH } from "@cryptopoker/contracts";
import { CreateRoomScreen } from "@/components/aurum/screens/create-room-screen";
import { InviteScreen } from "@/components/aurum/screens/invite-screen";
import { JoinInviteScreen } from "@/components/aurum/screens/join-invite-screen";
import { LobbyScreen } from "@/components/aurum/screens/lobby-screen";
import { RoomScreen } from "@/components/aurum/screens/room-screen";
import { TableScreen } from "@/components/aurum/screens/table-screen";
import { WelcomeScreen } from "@/components/aurum/screens/welcome-screen";
import { Backdrop } from "@/components/aurum/backdrop";
import { useRoomClient } from "@/lib/use-room-client";

export default function Home() {
  const roomClient = useRoomClient();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [roomClient.screen, roomClient.selectedRoom.id]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-sapphire-950 text-ivory-100" data-api-health-path={API_HEALTH_PATH}>
      <Backdrop />
      {roomClient.screen === "welcome" && (
        <WelcomeScreen onEnter={roomClient.enterLobby} busy={roomClient.sessionBusy} error={roomClient.sessionError} />
      )}
      {roomClient.screen === "lobby" && (
        <LobbyScreen
          playerName={roomClient.playerName}
          rooms={roomClient.rooms}
          onCreateRoom={() => roomClient.setScreen("create")}
          onInvitePreview={() => roomClient.setScreen("join")}
          onOpenRoom={roomClient.openRoom}
          onSignOut={roomClient.signOut}
        />
      )}
      {roomClient.screen === "waiting" && (
        <RoomScreen
          playerName={roomClient.playerName}
          room={roomClient.selectedRoom}
          onBackToLobby={() => roomClient.setScreen("lobby")}
          onDeal={() => roomClient.setScreen("table")}
          onApproveBuyIn={roomClient.approveBuyIn}
          onRejectBuyIn={roomClient.rejectBuyIn}
          onLeaveSeat={roomClient.leaveSeat}
          onInvitePreview={() => roomClient.setScreen("invite")}
          onCopyInvite={roomClient.copyInvite}
          onRequestBuyIn={roomClient.requestBuyIn}
          onLeaveWaitlist={roomClient.leaveWaitlist}
          onAcceptSeatOffer={roomClient.acceptSeatOffer}
          onDeclineSeatOffer={roomClient.declineSeatOffer}
          onShareInvite={roomClient.shareInvite}
          inviteActionMessage={roomClient.inviteActionMessage}
          playerId={roomClient.playerId}
          onSignOut={roomClient.signOut}
        />
      )}
      {roomClient.screen === "table" && (
        <TableScreen
          playerName={roomClient.playerName}
          room={roomClient.selectedRoom}
          onLeave={() => roomClient.setScreen("waiting")}
          onSignOut={roomClient.signOut}
        />
      )}
      {roomClient.screen === "create" && (
        <CreateRoomScreen
          playerName={roomClient.playerName}
          onCancel={() => roomClient.setScreen("lobby")}
          onCreate={roomClient.createRoom}
          onSignOut={roomClient.signOut}
        />
      )}
      {roomClient.screen === "join" && (
        <JoinInviteScreen
          playerName={roomClient.playerName}
          error={roomClient.inviteJoinError}
          onBack={() => roomClient.setScreen("lobby")}
          onJoinLink={roomClient.previewInviteLink}
          onSignOut={roomClient.signOut}
        />
      )}
      {roomClient.screen === "invite" && (
        <InviteScreen
          hostName={roomClient.selectedRoom.hostName}
          room={roomClient.selectedRoom}
          onJoin={roomClient.joinInvite}
          onSignIn={roomClient.signOut}
          onBack={() => roomClient.setScreen("lobby")}
          error={roomClient.inviteJoinError}
        />
      )}
    </div>
  );
}
