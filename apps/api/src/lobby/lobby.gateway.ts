import { OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Inject } from "@nestjs/common";
import type { Server, Socket } from "socket.io";
import { currentPlayerFromCookie } from "../sessions/current-player.js";
import { SessionStore } from "../sessions/session.store.js";
import { LobbyStore } from "./lobby.store.js";
import { playerChannel, RealtimeService, roomChannel } from "./realtime.service.js";

type AuthenticatedSocket = Socket & {
  data: {
    playerId?: string;
  };
};

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class LobbyGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    @Inject(SessionStore)
    private readonly sessions: SessionStore,
    @Inject(LobbyStore)
    private readonly lobby: LobbyStore,
    @Inject(RealtimeService)
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.realtime.attach(server);
  }

  handleConnection(client: AuthenticatedSocket): void {
    try {
      const player = currentPlayerFromCookie(this.sessions, client.handshake.headers.cookie).require();
      client.data.playerId = player.id;
      void client.join(playerChannel(player.id));
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage("room.subscribe")
  async subscribeToRoom(client: AuthenticatedSocket, payload: { roomId: string }): Promise<{ ok: boolean; code?: string }> {
    const playerId = client.data.playerId;
    if (!playerId || !this.lobby.playerCanAccessRoom(playerId, payload.roomId)) {
      return { ok: false, code: "ROOM_ACCESS_REQUIRED" };
    }

    await client.join(roomChannel(payload.roomId));
    return { ok: true };
  }
}
