# Single-parameter REST routes

The REST API will avoid nested multi-parameter routes such as `/rooms/:roomId/buy-ins/:buyInId/reject`. Command routes should identify the primary resource with at most one path parameter, and related identifiers should be carried in the request body or derived from persisted relationships; service logic remains responsible for validating Room membership, Host authority, and resource ownership.

Domain commands should use explicit verb endpoints, such as `/buy-ins/:buyInId/approve`, `/seat-offers/:seatOfferId/accept`, and `/rooms/:roomId/rotate-invite`, instead of generic status patches. These commands carry business rules and side effects, so the route should preserve the domain language.
