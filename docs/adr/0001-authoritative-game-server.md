# Authoritative game server

The API will be the authority for poker state: deck order, legal actions, turn timing, chip accounting, pots, hand progression, and room lifecycle. The frontend sends player intents and renders server state, because client-simulated hands would make multiplayer correctness and even play-money fairness depend on untrusted clients.
