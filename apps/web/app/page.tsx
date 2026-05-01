"use client";

import { useEffect } from "react";
import { API_HEALTH_PATH } from "@cryptopoker/contracts";
import { CreateRoomScreen } from "@/components/aurum/screens/create-room-screen";
import { InviteScreen } from "@/components/aurum/screens/invite-screen";
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
          onInvitePreview={() => roomClient.setScreen("invite")}
          onOpenRoom={roomClient.openRoom}
          onSignOut={() => roomClient.setScreen("welcome")}
        />
      )}
      {roomClient.screen === "waiting" && (
        <RoomScreen
          playerName={roomClient.playerName}
          room={roomClient.selectedRoom}
          onBackToLobby={() => roomClient.setScreen("lobby")}
          onDeal={() => roomClient.setScreen("table")}
          onInvitePreview={() => roomClient.setScreen("invite")}
          onSignOut={() => roomClient.setScreen("welcome")}
        />
      )}
      {roomClient.screen === "table" && (
        <TableScreen
          playerName={roomClient.playerName}
          room={roomClient.selectedRoom}
          onLeave={() => roomClient.setScreen("waiting")}
          onSignOut={() => roomClient.setScreen("welcome")}
        />
      )}
      {roomClient.screen === "create" && (
        <CreateRoomScreen
          playerName={roomClient.playerName}
          onCancel={() => roomClient.setScreen("lobby")}
          onCreate={roomClient.createRoom}
          onSignOut={() => roomClient.setScreen("welcome")}
        />
      )}
      {roomClient.screen === "invite" && (
        <InviteScreen
          hostName={roomClient.playerName}
          room={roomClient.selectedRoom}
          onJoin={roomClient.joinInvite}
          onSignIn={() => roomClient.setScreen("welcome")}
          onBack={() => roomClient.setScreen("lobby")}
        />
      )}
    </div>
  );
}
