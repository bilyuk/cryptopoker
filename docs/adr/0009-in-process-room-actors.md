# In-process room actors for live hands

Version 1 will run each active Room through an in-process Room Actor that serializes commands, owns live timers, and controls Live Hand transitions. Postgres remains the durable source for room records, approvals, seats, snapshots, and action history, while multi-instance room ownership and Redis-backed coordination are deferred until scaling requires them.
