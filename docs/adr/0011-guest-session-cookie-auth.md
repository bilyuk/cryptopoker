# Persistent guest session cookie auth

Version 1 will use opaque server-side guest sessions transported in persistent httpOnly cookies for the browser app. The cookie authenticates REST requests and Socket.IO connections, allowing a Player to return on the same browser and reclaim their Room, Seat, Waitlist position, or pending Buy-In without introducing accounts, passwords, wallets, or frontend-readable bearer tokens.
