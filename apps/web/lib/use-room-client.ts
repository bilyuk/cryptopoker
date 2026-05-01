"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  CURRENT_PLAYER_PATH,
  CURRENT_ROOM_PATH,
  PLAYERS_PATH,
  REALTIME_EVENTS,
  ROOMS_PATH,
  type CurrentPlayerResponse,
  type RoomDto,
  type RoomResponse,
} from "@cryptopoker/contracts";
import { defaultRooms } from "@/components/aurum/data";
import type { AppScreen, CreateRoomValues, Room } from "@/components/aurum/types";
import { API_BASE_URL, apiFetch } from "@/lib/api";

export function useRoomClient() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [playerName, setPlayerName] = useState("riverrat");
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState<string>();
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [selectedRoomId, setSelectedRoomId] = useState(defaultRooms[0].id);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0],
    [rooms, selectedRoomId],
  );

  useEffect(() => {
    let cancelled = false;

    async function resumePlayer() {
      try {
        const response = await apiFetch(CURRENT_PLAYER_PATH);
        if (!response.ok) return;

        const current = (await response.json()) as CurrentPlayerResponse;
        if (!cancelled) {
          setPlayerName(current.player.displayName);
          setScreen("lobby");
        }
      } catch {
        // The API may be unavailable while the frontend prototype is run alone.
      }
    }

    void resumePlayer();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const selectedServerRoom = rooms.find((room) => room.id === selectedRoomId && room.inviteCode);
    if (!selectedServerRoom) return;

    const socket = io(API_BASE_URL, { withCredentials: true, transports: ["websocket"] });
    socket.on("connect", () => {
      socket.emit("room.subscribe", { roomId: selectedServerRoom.id });
    });
    socket.on(REALTIME_EVENTS.roomUpdated, async () => {
      await refetchCurrentRoom();
    });

    return () => {
      socket.disconnect();
    };
  }, [rooms, selectedRoomId]);

  async function enterLobby(name: string) {
    setSessionBusy(true);
    setSessionError(undefined);

    try {
      const response = await apiFetch(PLAYERS_PATH, {
        method: "POST",
        body: JSON.stringify({ displayName: name || "riverrat" }),
      });

      if (!response.ok) {
        throw new Error("Player session request failed");
      }

      const current = (await response.json()) as CurrentPlayerResponse;
      setPlayerName(current.player.displayName);
      setScreen("lobby");
    } catch {
      setSessionError("The API is not reachable yet. Start the API server and try again.");
    } finally {
      setSessionBusy(false);
    }
  }

  function openRoom(room: Room) {
    if (room.full) return;
    setSelectedRoomId(room.id);
    setScreen("waiting");
  }

  async function createRoom(values: CreateRoomValues) {
    const response = await apiFetch(ROOMS_PATH, {
      method: "POST",
      body: JSON.stringify({
        name: values.name,
        ...parseBlinds(values.blinds),
        buyInMin: parseMoney(values.buyInMin),
        buyInMax: parseMoney(values.buyInMax),
        seatCount: Number(values.seats),
        actionTimerSeconds: parseTimer(values.timer),
      }),
    });

    if (!response.ok) return;

    const { room } = (await response.json()) as RoomResponse;
    const nextRoom = toUiRoom(room);

    setRooms((current) => [nextRoom, ...current.map((room) => ({ ...room, featured: false }))]);
    setSelectedRoomId(nextRoom.id);
    setScreen("waiting");
  }

  async function joinInvite() {
    if (!selectedRoom.inviteCode) return;

    const response = await apiFetch(`/invite-links/${selectedRoom.inviteCode}/join`, { method: "POST" });
    if (!response.ok) return;

    const { room } = (await response.json()) as RoomResponse;
    const nextRoom = toUiRoom(room);
    setRooms((current) => current.map((item) => (item.id === nextRoom.id ? nextRoom : item)));
    setSelectedRoomId(nextRoom.id);
    setScreen("waiting");
  }

  async function refetchCurrentRoom() {
    const response = await apiFetch(CURRENT_ROOM_PATH);
    if (!response.ok) return;

    const { room } = (await response.json()) as RoomResponse;
    const nextRoom = toUiRoom(room);
    setRooms((current) => current.map((item) => (item.id === nextRoom.id ? nextRoom : item)));
  }

  return {
    createRoom,
    enterLobby,
    joinInvite,
    openRoom,
    playerName,
    rooms,
    screen,
    selectedRoom,
    sessionBusy,
    sessionError,
    setScreen,
  };
}

function toUiRoom(room: RoomDto): Room {
  const occupiedSeats = room.seats.filter((seat) => seat.playerId).length;
  return {
    id: room.id,
    inviteCode: room.inviteCode,
    name: room.settings.name,
    variant: "No Limit Hold'em",
    blinds: `$${room.settings.smallBlind}/$${room.settings.bigBlind}`,
    buyIn: `$${room.settings.buyInMin}-$${room.settings.buyInMax}`,
    seats: `${occupiedSeats}/${room.settings.seatCount}`,
    timer: `${room.settings.actionTimerSeconds}s`,
    featured: true,
    private: true,
    status: occupiedSeats >= room.settings.seatCount ? "Full" : "Seats open",
    full: occupiedSeats >= room.settings.seatCount,
  };
}

function parseMoney(value: string): number {
  return Number(value.replace(/[^0-9.]/g, ""));
}

function parseTimer(value: string): number {
  return Number(value.replace(/[^0-9]/g, ""));
}

function parseBlinds(value: string): { smallBlind: number; bigBlind: number } {
  const [smallBlind, bigBlind] = value.split("/").map(parseMoney);
  return { smallBlind, bigBlind };
}
