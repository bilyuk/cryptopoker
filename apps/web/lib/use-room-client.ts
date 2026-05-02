"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  REALTIME_EVENTS,
  type CurrentPlayerResponse,
  type RoomResponse,
  type RoomUpdatedPayload,
} from "@cryptopoker/contracts";
import { defaultRooms } from "@/components/aurum/data";
import type { AppScreen, CreateRoomValues, Room } from "@/components/aurum/types";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { readInviteCode } from "@/lib/invite-code";
import { copyInviteLink, shareInviteLink } from "@/lib/invite-actions";
import { isCurrentPlayerInRoom, toUiRoomForPlayer } from "@/lib/room-view";

export function useRoomClient() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [playerId, setPlayerId] = useState<string>();
  const [playerName, setPlayerName] = useState("riverrat");
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState<string>();
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [selectedRoomId, setSelectedRoomId] = useState(defaultRooms[0].id);
  const [inviteActionMessage, setInviteActionMessage] = useState<string>();
  const [inviteJoinError, setInviteJoinError] = useState<string>();

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0],
    [rooms, selectedRoomId],
  );
  const currentPlayer = useMemo(
    () => selectedRoom?.players.find((player) => player.playerId === playerId),
    [selectedRoom, playerId],
  );

  useEffect(() => {
    let cancelled = false;

    async function resumePlayer() {
      try {
        const response = await apiFetch("/players/current");
        if (!response.ok) return;

        const current = (await response.json()) as CurrentPlayerResponse;
        if (!cancelled) {
          setPlayerId(current.player.id);
          setPlayerName(current.player.displayName);

          const roomResponse = await apiFetch("/rooms/current");
          if (roomResponse.ok) {
            const { room } = (await roomResponse.json()) as RoomResponse;
            const nextRoom = toUiRoomForPlayer(room, current.player.id);
            setRooms((currentRooms) => placeFeaturedRoom(currentRooms, nextRoom));
            setSelectedRoomId(nextRoom.id);
            setScreen("waiting");
          } else {
            setScreen("lobby");
          }
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

  const playerIdRef = useRef<string | undefined>(playerId);
  playerIdRef.current = playerId;
  // Subscribe only when the current Player is actually a member of the Room.
  // During invite preview, the Room has an inviteCode and id but the Player
  // isn't joined yet; subscribing then would fail with ROOM_ACCESS_REQUIRED
  // and wouldn't auto-recover when the Player joins (deps wouldn't change).
  const subscribableRoomId =
    isCurrentPlayerInRoom(selectedRoom, playerId) && selectedRoom.inviteCode ? selectedRoom.id : undefined;

  useEffect(() => {
    if (!subscribableRoomId) return;

    const socket = io(API_BASE_URL, { withCredentials: true, transports: ["websocket"] });
    socket.on("connect", () => {
      socket.emit("room.subscribe", { roomId: subscribableRoomId });
    });
    socket.on(REALTIME_EVENTS.roomUpdated, (payload: RoomUpdatedPayload) => {
      const nextRoom = toUiRoomForPlayer(payload.room, playerIdRef.current);
      setRooms((current) => current.map((item) => (item.id === nextRoom.id ? nextRoom : item)));
    });

    return () => {
      socket.disconnect();
    };
  }, [subscribableRoomId]);

  useEffect(() => {
    if (!selectedRoom || !currentPlayer?.seated) return;
    if (selectedRoom.hasStarted) {
      setScreen("table");
      return;
    }
    if (screen === "table") {
      setScreen("waiting");
    }
  }, [currentPlayer?.seated, screen, selectedRoom]);

  async function enterLobby(name: string) {
    setSessionBusy(true);
    setSessionError(undefined);

    try {
      const response = await apiFetch("/players", {
        method: "POST",
        body: JSON.stringify({ displayName: name || "riverrat" }),
      });

      if (!response.ok) {
        throw new Error("Player session request failed");
      }

      const current = (await response.json()) as CurrentPlayerResponse;
      setPlayerId(current.player.id);
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
    const response = await apiFetch("/rooms", {
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
    const nextRoom = toUiRoomForPlayer(room, playerId);

    setRooms((current) => placeFeaturedRoom(current, nextRoom));
    setSelectedRoomId(nextRoom.id);
    setScreen("waiting");
  }

  async function joinInvite() {
    if (!selectedRoom.inviteCode) {
      setInviteJoinError("Invite link is not available for this room.");
      return;
    }

    const response = await apiFetch(`/invite-links/${selectedRoom.inviteCode}/join`, { method: "POST" });
    if (!response.ok) {
      setInviteJoinError("You cannot join that Room from this browser right now.");
      return;
    }

    const { room } = (await response.json()) as RoomResponse;
    const nextRoom = toUiRoomForPlayer(room, playerId);
    setRooms((current) => current.map((item) => (item.id === nextRoom.id ? nextRoom : item)));
    setSelectedRoomId(nextRoom.id);
    setInviteJoinError(undefined);
    setScreen("waiting");
  }

  async function previewInviteLink(input: string) {
    const inviteCode = readInviteCode(input);
    if (!inviteCode) {
      setInviteJoinError("Paste a valid Invite Link or code.");
      return;
    }

    const response = await apiFetch(`/invite-links/${inviteCode}`);
    if (!response.ok) {
      setInviteJoinError("That Invite Link is invalid or expired.");
      return;
    }

    const { room } = (await response.json()) as RoomResponse;
    const nextRoom = toUiRoomForPlayer(room, playerId);
    setRooms((current) => placeFeaturedRoom(current, nextRoom));
    setSelectedRoomId(nextRoom.id);
    setInviteJoinError(undefined);
    setScreen("invite");
  }

  async function copyInvite() {
    if (!selectedRoom.inviteCode) {
      setInviteActionMessage("Invite link is not available for this room.");
      return;
    }

    const result = await copyInviteLink({
      origin: window.location.origin,
      inviteCode: selectedRoom.inviteCode,
      clipboard: navigator.clipboard,
    });
    setInviteActionMessage(result.message);
  }

  async function shareInvite() {
    if (!selectedRoom.inviteCode) {
      setInviteActionMessage("Invite link is not available for this room.");
      return;
    }

    const result = await shareInviteLink({
      origin: window.location.origin,
      inviteCode: selectedRoom.inviteCode,
      roomName: selectedRoom.name,
      share: navigator.share?.bind(navigator),
      clipboard: navigator.clipboard,
    });
    setInviteActionMessage(result.message);
  }

  async function signOut() {
    try {
      await apiFetch("/players/current/session", { method: "DELETE" });
    } finally {
      setPlayerId(undefined);
      setScreen("welcome");
      setInviteJoinError(undefined);
      setInviteActionMessage(undefined);
    }
  }

  async function runRoomCommand(path: string, body?: unknown) {
    if (!selectedRoom.inviteCode) return;
    await apiFetch(path, {
      method: "POST",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }

  const requestBuyIn = (amount: number) =>
    runRoomCommand("/buy-ins", { roomId: selectedRoom.id, amount });
  const expireBuyIn = (buyInId: string) => runRoomCommand(`/buy-ins/${buyInId}/expire`);
  const refundBuyIn = (buyInId: string) => runRoomCommand(`/buy-ins/${buyInId}/refund`);
  const leaveSeat = () => runRoomCommand("/seats/leave", { roomId: selectedRoom.id });
  const leaveWaitlist = () => runRoomCommand("/waitlist/leave", { roomId: selectedRoom.id });
  const acceptSeatOffer = (seatOfferId: string) => runRoomCommand(`/seat-offers/${seatOfferId}/accept`);
  const declineSeatOffer = (seatOfferId: string) => runRoomCommand(`/seat-offers/${seatOfferId}/decline`);
  const startFirstHand = () => runRoomCommand(`/rooms/${selectedRoom.id}/deal-first-hand`);

  return {
    acceptSeatOffer,
    expireBuyIn,
    refundBuyIn,
    createRoom,
    declineSeatOffer,
    copyInvite,
    enterLobby,
    joinInvite,
    leaveSeat,
    leaveWaitlist,
    openRoom,
    playerId,
    playerName,
    previewInviteLink,
    rooms,
    requestBuyIn,
    screen,
    selectedRoom,
    sessionBusy,
    sessionError,
    setScreen,
    startFirstHand,
    shareInvite,
    signOut,
    inviteJoinError,
    inviteActionMessage,
  };
}

function placeFeaturedRoom(current: Room[], next: Room): Room[] {
  return [next, ...current.filter((item) => item.id !== next.id).map((room) => ({ ...room, featured: false }))];
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
