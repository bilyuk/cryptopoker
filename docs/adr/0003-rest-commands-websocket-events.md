# REST commands with WebSocket events

The API will use REST endpoints for commands and resync snapshots, and WebSocket connections for room and table events. This avoids making every interaction depend on a live socket while still giving poker clients immediate updates for seats, buy-ins, waitlist offers, hand state, timers, and action logs.
