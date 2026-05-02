import { Body, Controller, Get, Headers, Inject, Param, Patch, Post } from "@nestjs/common";
import type {
  CreateRoomRequest,
  RoomResponse,
  UpdateRoomSettingsRequest,
} from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { currentPlayerFromCookie } from "../sessions/current-player.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class RoomsController {
  constructor(
    @Inject(SessionStore)
    private readonly sessions: SessionStore,
    @Inject(LobbyStore)
    private readonly lobby: LobbyStore,
  ) {}

  @Post("/rooms")
  createRoom(@Headers("cookie") cookieHeader: string | undefined, @Body() body: CreateRoomRequest): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.createRoom(player, body) };
  }

  @Get("/rooms/current")
  currentRoom(@Headers("cookie") cookieHeader: string | undefined): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.currentRoom(player) };
  }

  @Patch("/rooms/:roomId/settings")
  updateSettings(
    @Headers("cookie") cookieHeader: string | undefined,
    @Param("roomId") roomId: string,
    @Body() body: UpdateRoomSettingsRequest,
  ): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.updateSettings(player, roomId, body) };
  }

  @Post("/rooms/:roomId/rotate-invite")
  rotateInvite(@Headers("cookie") cookieHeader: string | undefined, @Param("roomId") roomId: string): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.rotateInvite(player, roomId) };
  }

  @Post("/rooms/:roomId/deal-first-hand")
  startFirstHand(@Headers("cookie") cookieHeader: string | undefined, @Param("roomId") roomId: string): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.startFirstHand(player, roomId) };
  }
}
