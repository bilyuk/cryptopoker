import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import {
  CURRENT_ROOM_PATH,
  ROOMS_PATH,
  type CreateRoomRequest,
  type RoomResponse,
  type UpdateRoomSettingsRequest,
} from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { requirePlayer } from "./auth.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class RoomsController {
  constructor(
    private readonly sessions: SessionStore,
    private readonly lobby: LobbyStore,
  ) {}

  @Post(ROOMS_PATH)
  createRoom(@Headers("cookie") cookieHeader: string | undefined, @Body() body: CreateRoomRequest): RoomResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { room: this.lobby.createRoom(player, body) };
  }

  @Get(CURRENT_ROOM_PATH)
  currentRoom(@Headers("cookie") cookieHeader: string | undefined): RoomResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { room: this.lobby.currentRoom(player) };
  }

  @Patch("/rooms/:roomId/settings")
  updateSettings(
    @Headers("cookie") cookieHeader: string | undefined,
    @Param("roomId") roomId: string,
    @Body() body: UpdateRoomSettingsRequest,
  ): RoomResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { room: this.lobby.updateSettings(player, roomId, body) };
  }

  @Post("/rooms/:roomId/rotate-invite")
  rotateInvite(@Headers("cookie") cookieHeader: string | undefined, @Param("roomId") roomId: string): RoomResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { room: this.lobby.rotateInvite(player, roomId) };
  }
}
