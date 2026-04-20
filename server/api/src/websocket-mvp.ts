import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import type { Express } from "express";
import { WebSocket, WebSocketServer } from "ws";
import {
  mvpJoinRoomRequestSchema,
  mvpJoinRoomResponseSchema,
  mvpSocketSessionQuerySchema,
  mvpWebsocketClientMessageSchema,
  mvpWebsocketServerMessageSchema,
  schemaVersion,
  type MvpRoomPlayer,
  type MvpRoomSnapshot,
  type MvpWebsocketServerMessage
} from "@cryptopoker/api-schema";

const SEATS = ["north", "east", "south", "west"] as const;

export type MvpWebsocketPlayer = MvpRoomPlayer;
export type MvpWebsocketRoomSnapshot = MvpRoomSnapshot;

interface RoomRecord {
  roomId: string;
  roomName: string;
  playersById: Map<string, MvpWebsocketPlayer>;
}

interface SessionLookup {
  roomId: string;
  player: MvpWebsocketPlayer;
}

class MvpRoomStore {
  private roomCounter = 1;
  private playerCounter = 1;
  private readonly roomsById = new Map<string, RoomRecord>();
  private readonly roomIdByName = new Map<string, string>();

  createOrJoinRoom(displayName: string, roomName: string): { roomId: string; player: MvpWebsocketPlayer } {
    const trimmedName = roomName.trim().length > 0 ? roomName.trim() : "Aurum Table";
    const existingRoomId = this.roomIdByName.get(trimmedName);
    const room = existingRoomId ? this.roomsById.get(existingRoomId)! : this.createRoom(trimmedName);

    if (room.playersById.size >= SEATS.length) {
      throw new Error("room_full");
    }

    const seat = SEATS[room.playersById.size];
    const player: MvpWebsocketPlayer = {
      id: `player_${this.playerCounter++}`,
      displayName,
      seat,
      chips: 1_000,
      connected: false
    };

    room.playersById.set(player.id, player);
    return { roomId: room.roomId, player: { ...player } };
  }

  connectPlayer(roomId: string, playerId: string): SessionLookup | null {
    const room = this.roomsById.get(roomId);
    const player = room?.playersById.get(playerId);
    if (!room || !player) {
      return null;
    }

    player.connected = true;
    return { roomId, player: { ...player } };
  }

  disconnectPlayer(roomId: string, playerId: string): void {
    const room = this.roomsById.get(roomId);
    const player = room?.playersById.get(playerId);
    if (!player) {
      return;
    }
    player.connected = false;
  }

  getRoomSnapshot(roomId: string): MvpWebsocketRoomSnapshot | null {
    const room = this.roomsById.get(roomId);
    if (!room) {
      return null;
    }

    return {
      roomId: room.roomId,
      roomName: room.roomName,
      players: Array.from(room.playersById.values()).map((player) => ({ ...player }))
    };
  }

  private createRoom(roomName: string): RoomRecord {
    const roomId = `room_${this.roomCounter++}`;
    const room: RoomRecord = {
      roomId,
      roomName,
      playersById: new Map()
    };
    this.roomsById.set(roomId, room);
    this.roomIdByName.set(roomName, roomId);
    return room;
  }
}

interface RoomSocket extends WebSocket {
  roomId?: string;
  playerId?: string;
}

export interface MvpWebsocketApp {
  app: Express;
  server: http.Server;
}

export const createMvpWebsocketApp = (): MvpWebsocketApp => {
  const app = express();
  const roomStore = new MvpRoomStore();

  app.use(express.json());
  const foundationDir = resolveFoundationDir();
  if (foundationDir) {
    app.use(express.static(foundationDir));
  }

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/rooms", (req, res) => {
    const parsed = mvpJoinRoomRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "display_name_too_short" });
      return;
    }

    try {
      const displayName = parsed.data.displayName;
      const roomName = parsed.data.roomName ?? "Aurum Table";
      const joined = roomStore.createOrJoinRoom(displayName, roomName);
      res.status(201).json(
        mvpJoinRoomResponseSchema.parse({
          roomId: joined.roomId,
          roomName,
          player: joined.player
        })
      );
    } catch (error) {
      if (error instanceof Error && error.message === "room_full") {
        res.status(409).json({ error: "room_full" });
        return;
      }
      res.status(500).json({ error: "internal_error" });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("error", () => {
    // startup listen errors are handled by the owning HTTP server listener
  });

  const sendServerMessage = (socket: WebSocket, payload: MvpWebsocketServerMessage) => {
    socket.send(JSON.stringify(mvpWebsocketServerMessageSchema.parse(payload)));
  };

  const broadcastRoom = (roomId: string, payload: MvpWebsocketServerMessage) => {
    for (const client of wss.clients) {
      const socket = client as RoomSocket;
      if (socket.readyState !== WebSocket.OPEN || socket.roomId !== roomId) {
        continue;
      }
      sendServerMessage(socket, payload);
    }
  };

  wss.on("connection", (socket, req) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const parsedQuery = mvpSocketSessionQuerySchema.safeParse({
      roomId: url.searchParams.get("roomId"),
      playerId: url.searchParams.get("playerId")
    });

    if (!parsedQuery.success) {
      socket.close(1008, "invalid_session");
      return;
    }

    const { roomId, playerId } = parsedQuery.data;
    const session = roomStore.connectPlayer(roomId, playerId);

    if (!session) {
      socket.close(1008, "invalid_session");
      return;
    }

    const typedSocket = socket as RoomSocket;
    typedSocket.roomId = roomId;
    typedSocket.playerId = playerId;

    const currentRoom = roomStore.getRoomSnapshot(roomId);
    if (!currentRoom) {
      typedSocket.close(1011, "room_state_missing");
      return;
    }

    sendServerMessage(typedSocket, {
      version: schemaVersion,
      type: "room:welcome",
      room: currentRoom,
      player: session.player
    });

    const connectedRoom = roomStore.getRoomSnapshot(roomId);
    if (connectedRoom) {
      broadcastRoom(roomId, {
        version: schemaVersion,
        type: "room:presence",
        room: connectedRoom
      });
    }

    typedSocket.on("message", (rawData) => {
      let message: unknown;
      try {
        message = JSON.parse(String(rawData));
      } catch {
        sendServerMessage(typedSocket, {
          version: schemaVersion,
          type: "error",
          code: "invalid_json"
        });
        return;
      }

      const parsedMessage = mvpWebsocketClientMessageSchema.safeParse(message);
      if (!parsedMessage.success) {
        sendServerMessage(typedSocket, {
          version: schemaVersion,
          type: "error",
          code: "invalid_message"
        });
        return;
      }

      const room = roomStore.getRoomSnapshot(roomId);
      const sender = room?.players.find((player) => player.id === playerId);
      if (!sender) {
        sendServerMessage(typedSocket, {
          version: schemaVersion,
          type: "error",
          code: "internal_error"
        });
        return;
      }

      broadcastRoom(roomId, {
        version: schemaVersion,
        type: "chat:message",
        at: new Date().toISOString(),
        from: sender.displayName,
        text: parsedMessage.data.text
      });
    });

    typedSocket.on("close", () => {
      roomStore.disconnectPlayer(roomId, playerId);
      const disconnectedRoom = roomStore.getRoomSnapshot(roomId);
      if (!disconnectedRoom) {
        return;
      }

      broadcastRoom(roomId, {
        version: schemaVersion,
        type: "room:presence",
        room: disconnectedRoom
      });
    });
  });

  return { app, server };
};

export const startMvpWebsocketServer = async (port = 3000): Promise<http.Server> => {
  const { server } = createMvpWebsocketApp();
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.listen(port, onListening);
  });
  return server;
};

const resolveFoundationDir = (): string | null => {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), "ui/web-table-foundation"),
    path.resolve(process.cwd(), "../ui/web-table-foundation"),
    path.resolve(moduleDir, "../../ui/web-table-foundation"),
    path.resolve(moduleDir, "../../../ui/web-table-foundation")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      return candidate;
    }
  }

  return null;
};
