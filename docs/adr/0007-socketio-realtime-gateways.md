# Socket.IO realtime gateways

The NestJS API will use Socket.IO gateways for realtime room and table updates. Socket.IO rooms match the product concept of private poker Rooms, and acknowledgements/timeouts are useful for flows such as seat offers, host approval prompts, reconnects, and targeted player updates.

The first slice will prefer coarse-grained events such as `room.updated`, `buyIn.updated`, `seat.updated`, `waitlist.updated`, `seatOffer.created`, `seatOffer.updated`, and `player.updated`, with REST snapshots as the recovery path. Targeted prompts use private player channels, while broad Room changes use Room channels.
