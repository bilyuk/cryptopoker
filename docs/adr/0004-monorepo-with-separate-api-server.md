# Monorepo with separate API server

The project will become a monorepo with the existing Next frontend and a separate API server in distinct workspaces. The API server owns authoritative poker state, WebSocket connections, timers, and room lifecycle work that would be brittle inside frontend route handlers.
