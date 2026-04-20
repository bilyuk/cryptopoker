import { z } from "zod";
import { schemaVersion } from "./events.js";

export const mvpSeatSchema = z.enum(["north", "east", "south", "west"]);
export type MvpSeat = z.infer<typeof mvpSeatSchema>;

export const mvpRoomPlayerSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(2),
  seat: mvpSeatSchema,
  chips: z.number().int().nonnegative(),
  connected: z.boolean()
});
export type MvpRoomPlayer = z.infer<typeof mvpRoomPlayerSchema>;

export const mvpRoomSnapshotSchema = z.object({
  roomId: z.string().min(1),
  roomName: z.string().min(1),
  players: z.array(mvpRoomPlayerSchema)
});
export type MvpRoomSnapshot = z.infer<typeof mvpRoomSnapshotSchema>;

export const mvpJoinRoomRequestSchema = z.object({
  displayName: z.string().trim().min(2).max(32),
  roomName: z.string().trim().min(1).max(64).optional()
});
export type MvpJoinRoomRequest = z.infer<typeof mvpJoinRoomRequestSchema>;

export const mvpJoinRoomResponseSchema = z.object({
  roomId: z.string().min(1),
  roomName: z.string().min(1),
  player: mvpRoomPlayerSchema
});
export type MvpJoinRoomResponse = z.infer<typeof mvpJoinRoomResponseSchema>;

export const mvpSocketSessionQuerySchema = z.object({
  roomId: z.string().min(1),
  playerId: z.string().min(1)
});
export type MvpSocketSessionQuery = z.infer<typeof mvpSocketSessionQuerySchema>;

export const mvpChatSendMessageSchema = z.object({
  type: z.literal("chat:send"),
  text: z.string().trim().min(1).max(240)
});
export type MvpChatSendMessage = z.infer<typeof mvpChatSendMessageSchema>;

export const mvpWebsocketClientMessageSchema = z.discriminatedUnion("type", [mvpChatSendMessageSchema]);
export type MvpWebsocketClientMessage = z.infer<typeof mvpWebsocketClientMessageSchema>;

const mvpServerMessageBaseSchema = z.object({
  version: z.literal(schemaVersion)
});

export const mvpRoomWelcomeMessageSchema = mvpServerMessageBaseSchema.extend({
  type: z.literal("room:welcome"),
  room: mvpRoomSnapshotSchema,
  player: mvpRoomPlayerSchema
});
export type MvpRoomWelcomeMessage = z.infer<typeof mvpRoomWelcomeMessageSchema>;

export const mvpRoomPresenceMessageSchema = mvpServerMessageBaseSchema.extend({
  type: z.literal("room:presence"),
  room: mvpRoomSnapshotSchema
});
export type MvpRoomPresenceMessage = z.infer<typeof mvpRoomPresenceMessageSchema>;

export const mvpChatMessageSchema = mvpServerMessageBaseSchema.extend({
  type: z.literal("chat:message"),
  at: z.string().datetime(),
  from: z.string().min(2),
  text: z.string().trim().min(1).max(240)
});
export type MvpChatMessage = z.infer<typeof mvpChatMessageSchema>;

export const mvpServerErrorCodeSchema = z.enum(["invalid_json", "invalid_message", "internal_error"]);
export type MvpServerErrorCode = z.infer<typeof mvpServerErrorCodeSchema>;

export const mvpErrorMessageSchema = mvpServerMessageBaseSchema.extend({
  type: z.literal("error"),
  code: mvpServerErrorCodeSchema
});
export type MvpErrorMessage = z.infer<typeof mvpErrorMessageSchema>;

export const mvpWebsocketServerMessageSchema = z.discriminatedUnion("type", [
  mvpRoomWelcomeMessageSchema,
  mvpRoomPresenceMessageSchema,
  mvpChatMessageSchema,
  mvpErrorMessageSchema
]);
export type MvpWebsocketServerMessage = z.infer<typeof mvpWebsocketServerMessageSchema>;
