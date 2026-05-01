# Postgres with TypeORM persistence

The API server will use Postgres as the durable source of truth and TypeORM for persistence mapping. This pairs naturally with the NestJS module style and will store Rooms, Players, sessions, Buy-Ins, Seats, Waitlists, Hand records, action history, and reconnectable state while the first live-hand timers and in-progress game state can remain process-owned.
