# Websocket Protocol Contract (CRY-72)

Schema version: `0.2.0`

Source of truth:

- `contracts/api-schema/src/websocket.ts`

## Transport

- HTTP room join: `POST /api/rooms`
- Websocket handshake: `ws://<host>/ws?roomId=<roomId>&playerId=<playerId>`
- Every server websocket payload includes `version`.

## HTTP join contract

Request:

```json
{
  "displayName": "alice",
  "roomName": "Velvet"
}
```

Response:

```json
{
  "roomId": "room_1",
  "roomName": "Velvet",
  "player": {
    "id": "player_1",
    "displayName": "alice",
    "seat": "north",
    "chips": 1000,
    "connected": false
  }
}
```

## Websocket client -> server

- `chat:send`

```json
{
  "type": "chat:send",
  "text": "hello table"
}
```

## Websocket server -> client

- `room:welcome`
- `room:presence`
- `chat:message`
- `error`

`error.code` values:

- `invalid_json`
- `invalid_message`
- `internal_error`
