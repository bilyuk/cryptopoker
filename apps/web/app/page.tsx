"use client";

import { useEffect, useMemo, useState } from "react";
import { API_HEALTH_PATH } from "@cryptopoker/contracts";
import { CreateRoomScreen } from "@/components/aurum/screens/create-room-screen";
import { InviteScreen } from "@/components/aurum/screens/invite-screen";
import { LobbyScreen } from "@/components/aurum/screens/lobby-screen";
import { RoomScreen } from "@/components/aurum/screens/room-screen";
import { TableScreen } from "@/components/aurum/screens/table-screen";
import { WelcomeScreen } from "@/components/aurum/screens/welcome-screen";
import { Backdrop } from "@/components/aurum/backdrop";
import { defaultRooms } from "@/components/aurum/data";
import type { AppScreen, CreateRoomValues, Room } from "@/components/aurum/types";

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [playerName, setPlayerName] = useState("riverrat");
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [selectedRoomId, setSelectedRoomId] = useState(defaultRooms[0].id);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0],
    [rooms, selectedRoomId],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [screen, selectedRoomId]);

  function enterLobby(name: string) {
    setPlayerName(name || "riverrat");
    setScreen("lobby");
  }

  function openRoom(room: Room) {
    if (room.full) return;
    setSelectedRoomId(room.id);
    setScreen("waiting");
  }

  function createRoom(values: CreateRoomValues) {
    const nextRoom: Room = {
      id: crypto.randomUUID(),
      name: values.name,
      variant: "No Limit Hold'em",
      blinds: values.blinds,
      buyIn: `${values.buyInMin}-${values.buyInMax}`,
      seats: `1/${values.seats}`,
      timer: values.timer,
      featured: true,
      private: true,
      status: "Seats open",
    };

    setRooms((current) => [nextRoom, ...current.map((room) => ({ ...room, featured: false }))]);
    setSelectedRoomId(nextRoom.id);
    setScreen("waiting");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-sapphire-950 text-ivory-100" data-api-health-path={API_HEALTH_PATH}>
      <Backdrop />
      {screen === "welcome" && <WelcomeScreen onEnter={enterLobby} />}
      {screen === "lobby" && (
        <LobbyScreen
          playerName={playerName}
          rooms={rooms}
          onCreateRoom={() => setScreen("create")}
          onInvitePreview={() => setScreen("invite")}
          onOpenRoom={openRoom}
          onSignOut={() => setScreen("welcome")}
        />
      )}
      {screen === "waiting" && (
        <RoomScreen
          playerName={playerName}
          room={selectedRoom}
          onBackToLobby={() => setScreen("lobby")}
          onDeal={() => setScreen("table")}
          onInvitePreview={() => setScreen("invite")}
          onSignOut={() => setScreen("welcome")}
        />
      )}
      {screen === "table" && (
        <TableScreen
          playerName={playerName}
          room={selectedRoom}
          onLeave={() => setScreen("waiting")}
          onSignOut={() => setScreen("welcome")}
        />
      )}
      {screen === "create" && (
        <CreateRoomScreen
          playerName={playerName}
          onCancel={() => setScreen("lobby")}
          onCreate={createRoom}
          onSignOut={() => setScreen("welcome")}
        />
      )}
      {screen === "invite" && (
        <InviteScreen
          hostName={playerName}
          room={selectedRoom}
          onJoin={() => setScreen("waiting")}
          onSignIn={() => setScreen("welcome")}
          onBack={() => setScreen("lobby")}
        />
      )}
    </div>
  );
}
