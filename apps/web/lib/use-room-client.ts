"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  BUY_INS_PATH,
  buyInApprovePath,
  CURRENT_PLAYER_PATH,
  CURRENT_PLAYER_SESSION_PATH,
  CURRENT_ROOM_PATH,
  inviteLinkJoinPath,
  inviteLinkPath,
  PLAYERS_PATH,
  REALTIME_EVENTS,
  ROOMS_PATH,
  SEATS_CLAIM_PATH,
  SEATS_LEAVE_PATH,
  seatOfferAcceptPath,
  seatOfferDeclinePath,
  WAITLIST_JOIN_PATH,
  WAITLIST_LEAVE_PATH,
  type CurrentPlayerResponse,
  type RoomResponse,
  type RoomUpdatedPayload,
} from "@cryptopoker/contracts";
import { defaultRooms } from "@/components/aurum/data";
import type { AppScreen, CreateRoomValues, Room } from "@/components/aurum/types";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { readInviteCode } from "@/lib/invite-code";
import { copyInviteLink, shareInviteLink } from "@/lib/invite-actions";
import { toUiRoomForPlayer } from "@/lib/room-view";

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

  useEffect(() => {
    let cancelled = false;

    async function resumePlayer() {
      try {
        const response = await apiFetch(CURRENT_PLAYER_PATH);
        if (!response.ok) return;

        const current = (await response.json()) as CurrentPlayerResponse;
        if (!cancelled) {
          setPlayerId(current.player.id);
          setPlayerName(current.player.displayName);

          const roomResponse = await apiFetch(CURRENT_ROOM_PATH);
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
  const selectedServerRoomId = selectedRoom.inviteCode ? selectedRoom.id : undefined;

  useEffect(() => {
    if (!selectedServerRoomId) return;

    const socket = io(API_BASE_URL, { withCredentials: true, transports: ["websocket"] });
    socket.on("connect", () => {
      socket.emit("room.subscribe", { roomId: selectedServerRoomId });
    });
    socket.on(REALTIME_EVENTS.roomUpdated, (payload: RoomUpdatedPayload) => {
      const nextRoom = toUiRoomForPlayer(payload.room, playerIdRef.current);
      setRooms((current) => current.map((item) => (item.id === nextRoom.id ? nextRoom : item)));
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedServerRoomId]);

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

    const response = await apiFetch(inviteLinkJoinPath(selectedRoom.inviteCode), { method: "POST" });
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

    const response = await apiFetch(inviteLinkPath(inviteCode));
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
      await apiFetch(CURRENT_PLAYER_SESSION_PATH, { method: "DELETE" });
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

  const requestBuyIn = () =>
    runRoomCommand(BUY_INS_PATH, { roomId: selectedRoom.id, amount: selectedRoom.buyInMinValue });
  const approveBuyIn = (buyInId: string) => runRoomCommand(buyInApprovePath(buyInId));
  const claimSeat = (seatNumber: number) =>
    runRoomCommand(SEATS_CLAIM_PATH, { roomId: selectedRoom.id, seatNumber });
  const leaveSeat = () => runRoomCommand(SEATS_LEAVE_PATH, { roomId: selectedRoom.id });
  const joinWaitlist = () => runRoomCommand(WAITLIST_JOIN_PATH, { roomId: selectedRoom.id });
  const leaveWaitlist = () => runRoomCommand(WAITLIST_LEAVE_PATH, { roomId: selectedRoom.id });
  const acceptSeatOffer = (seatOfferId: string) => runRoomCommand(seatOfferAcceptPath(seatOfferId));
  const declineSeatOffer = (seatOfferId: string) => runRoomCommand(seatOfferDeclinePath(seatOfferId));

  return {
    acceptSeatOffer,
    approveBuyIn,
    claimSeat,
    createRoom,
    declineSeatOffer,
    copyInvite,
    enterLobby,
    joinInvite,
    joinWaitlist,
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
