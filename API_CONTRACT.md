# Eventify — REST API Contract (v1)

This document is the shared interface between backend and frontend. Endpoints, payloads,
and status codes below are the source of truth — frontend can build against this even
before an endpoint is implemented, and its shape shouldn't change without updating this
file first.

Base URL (dev): `http://localhost:8000`
All endpoints are prefixed with `/api`.

## Conventions

- **Auth**: Bearer JWT in `Authorization: Bearer <token>` header, obtained from `/api/auth/login`.
- **Roles**: `GUEST` (unauthenticated), `ATTENDEE`, `ORGANIZER`, `ADMIN`.
- **Dates**: ISO 8601 strings, e.g. `2026-07-12T20:30:00`.
- **IDs**: `event_id` looks like `EV1024`, `ticket_type_id` like `T1`, `booking_id` like `B501` (server-generated).
- **Pagination**: list endpoints accept `?page=1&page_size=20` and respond with
  `{ "items": [...], "total": <int>, "page": <int>, "page_size": <int> }`.
- **Errors**: `{ "detail": "human readable message" }` with the appropriate 4xx/5xx status.

---

## 1. Auth & Registration

### POST /api/auth/register
Public. Registers a new user as `ATTENDEE` or `ORGANIZER` (role chosen on the sign-up
page, not left to the client to set arbitrarily — this replaces the current `?role=` query
param, which lets anyone register as ADMIN).

Request:
```json
{
  "username": "maria21",
  "password": "secret123",
  "confirm_password": "secret123",
  "role": "ATTENDEE",
  "first_name": "Maria",
  "last_name": "Papadopoulou",
  "email": "maria@example.com",
  "phone": "+306912345678",
  "address": "Λεωφόρος Κεντρική 25",
  "city": "Αθήνα",
  "country": "Greece",
  "afm": "123456789",
  "latitude": 37.9838,
  "longitude": 23.7275
}
```
Response `201`: `{ "message": "Registration submitted, pending admin approval." }`
Errors: `400` username taken, `400` email taken, `422` validation (password mismatch, AFM format, etc.)

### POST /api/auth/login
Public. OAuth2 password form (`username`, `password` as form fields, matches current implementation).
Response `200`: `{ "access_token": "...", "token_type": "bearer", "role": "ATTENDEE", "user_id": 12 }`
Errors: `401` bad credentials, `403` not yet approved.

### GET /api/auth/me
Auth required (any role). Returns the current user's own profile.
Response `200`: `UserResponse` (see below).

---

## 2. Admin — User Management

### GET /api/admin/users
Admin only. `?status=pending|approved|all&page=&page_size=`
Response `200`: paginated list of `UserResponse`.

### GET /api/admin/users/{user_id}
Admin only. Full profile of one user.

### PUT /api/admin/users/{user_id}/approve
Admin only. Sets `is_approved = true`. Response `200`: updated `UserResponse`.

### PUT /api/admin/users/{user_id}/reject
Admin only. Rejects (deletes or flags) the pending registration. Response `204`.

### `UserResponse` shape
```json
{
  "id": 12,
  "username": "maria21",
  "role": "ATTENDEE",
  "is_approved": true,
  "first_name": "Maria",
  "last_name": "Papadopoulou",
  "email": "maria@example.com",
  "phone": "+306912345678",
  "address": "Λεωφόρος Κεντρική 25",
  "city": "Αθήνα",
  "country": "Greece",
  "afm": "123456789",
  "latitude": 37.9838,
  "longitude": 23.7275,
  "created_at": "2026-01-10T09:00:00"
}
```

---

## 3. Events — Organizer Management

### POST /api/events
Organizer only. Creates a new event in `DRAFT` status.

Request:
```json
{
  "title": "Συναυλία Σύγχρονης Μουσικής",
  "categories": ["Music", "Live Performance"],
  "event_type": "Concert",
  "venue": "Θέατρο Πόλης",
  "address": "Λεωφόρος Κεντρική 25",
  "city": "Αθήνα",
  "country": "Greece",
  "latitude": 37.9838,
  "longitude": 23.7275,
  "start_datetime": "2026-07-12T20:30:00",
  "end_datetime": "2026-07-12T23:00:00",
  "capacity": 350,
  "description": "Βραδιά με έργα σύγχρονων δημιουργών...",
  "ticket_types": [
    { "name": "General Admission", "price": 18.00, "quantity": 250 },
    { "name": "Student", "price": 12.00, "quantity": 100 }
  ]
}
```
Validation: `sum(ticket_types.quantity) <= capacity`, `end_datetime > start_datetime`.
Response `201`: full `EventResponse` (see §5).
Errors: `422` if ticket quantities exceed capacity.

### GET /api/events/mine
Organizer only. Their own events (any status), paginated.

### PUT /api/events/{event_id}
Organizer (owner) only. Edits event fields. Ticket types can be added/edited here too,
subject to the same capacity constraint. Only allowed while not `CANCELLED`/`COMPLETED`.

### DELETE /api/events/{event_id}
Organizer (owner) only. **Only allowed if status is `DRAFT` or no bookings exist yet.**
Response `204`. Error `409` if a booking already exists (use cancel instead).

### POST /api/events/{event_id}/publish
Organizer (owner) only. `DRAFT` → `PUBLISHED`. Response `200`: updated `EventResponse`.

### POST /api/events/{event_id}/photos
Organizer (owner) only. Multipart file upload (`file` field), JPEG/PNG/WEBP/GIF, max
5MB. Stored on local disk under `backend/static/uploads`, served back from
`/static/uploads/<generated-filename>`. Response `201`: updated `EventResponse`
(check `photos` for the new entry).

### DELETE /api/events/{event_id}/photos/{photo_id}
Organizer (owner) only. Removes the photo file and its DB record. Response `204`.

### POST /api/events/{event_id}/cancel
Organizer (owner) only. `PUBLISHED` → `CANCELLED`. Existing bookings are kept
(marked historical, not deleted). New bookings are blocked from this point.
Also triggers the option to notify attendees (§6).
Response `200`: updated `EventResponse`.

### GET /api/events/{event_id}/bookings
Organizer (owner) only. All bookings placed for this event.
Response `200`: list of `BookingResponse` (see §4).

---

## 4. Bookings

### POST /api/events/{event_id}/bookings
Attendee only. Books tickets. Requires a confirmation step client-side (irreversible server-side).

Request:
```json
{ "ticket_type_id": "T1", "number_of_tickets": 2 }
```
Server checks (all enforced, not just client-side):
- event status is `PUBLISHED` and has not ended,
- `ticket_type.available >= number_of_tickets`,
- booking won't push total booked seats over `capacity`.

On success: decrements `ticket_type.available`, creates `Booking` with status `CONFIRMED`.
Response `201`: `BookingResponse`.
Errors: `409` not enough availability, `409` event not bookable (cancelled/ended/draft).

### GET /api/bookings/mine
Attendee only. The current user's booking history (also the raw signal for recommendations).

### `BookingResponse` shape
```json
{
  "booking_id": "B501",
  "event_id": "EV1024",
  "event_title": "Συναυλία Σύγχρονης Μουσικής",
  "ticket_type_id": "T1",
  "ticket_type_name": "General Admission",
  "number_of_tickets": 2,
  "total_cost": 36.00,
  "booking_status": "CONFIRMED",
  "time": "2025-06-20T11:42:10"
}
```

---

## 5. Public Browsing / Search

### GET /api/events
Public (guest-accessible). Search & browse **published** events only (draft/cancelled/completed
are excluded from this endpoint - organizers see their own full history via `/api/events/mine`).

Query params:
| Param | Type | Matches |
|---|---|---|
| `q` | string | title + description (free text) |
| `location` | string | city + address + venue (free text) |
| `categories` | string, repeatable (`?categories=Music&categories=Jazz`) | event has ANY of the given categories |
| `date_from` / `date_to` | ISO datetime | event's `start_datetime` within range |
| `price_min` / `price_max` | number | event's *cheapest* ticket type price within range |
| `page` / `page_size` | int | pagination |

All text matching is accent- and case-insensitive (so `αθηνα`, `ΑΘΉΝΑ`, and `Αθήνα` all match each
other) - implemented via a small SQLite function registered in `database.py`, mirroring the
`removeAccents()` helper already used on the frontend's search page.

Response `200`: paginated list of `EventSummary` (lighter than full detail - title, categories,
city, country, start date, status, price range, cover photo).

### GET /api/events/{event_id}
Public. Full event detail (includes ticket types with live availability, geolocation for
the map, photos, organizer display name). If the requester is authenticated, this call
also logs an `EventView` (used by the recommender).

### `EventResponse` shape
```json
{
  "event_id": "EV1024",
  "title": "Συναυλία Σύγχρονης Μουσικής",
  "categories": ["Music", "Live Performance"],
  "event_type": "Concert",
  "venue": "Θέατρο Πόλης",
  "address": "Λεωφόρος Κεντρική 25",
  "city": "Αθήνα",
  "country": "Greece",
  "latitude": 37.9838,
  "longitude": 23.7275,
  "start_datetime": "2026-07-12T20:30:00",
  "end_datetime": "2026-07-12T23:00:00",
  "capacity": 350,
  "total_booked": 2,
  "status": "PUBLISHED",
  "description": "...",
  "organizer_id": 7,
  "organizer_name": "org_athens_events",
  "photos": ["cover1.jpg", "hall.jpg"],
  "ticket_types": [
    { "ticket_type_id": "T1", "name": "General Admission", "price": 18.00, "quantity": 250, "available": 180 },
    { "ticket_type_id": "T2", "name": "Student", "price": 12.00, "quantity": 100, "available": 75 }
  ]
}
```

---

## 6. Messaging

### GET /api/messages/inbox
Auth required. `?page=&page_size=`. Response includes `is_read` per message.

### GET /api/messages/sent
Auth required. Same shape, sender's own messages.

### GET /api/messages/unread-count
Auth required. `{ "unread": 3 }` — used for the nav-bar badge.

### POST /api/messages
Auth required. Send a message to another user (typically organizer ↔ attendee of a shared event).
```json
{ "recipient_id": 12, "event_id": "EV1024", "subject": "Question about parking", "body": "..." }
```

### PUT /api/messages/{message_id}/read
Auth required (must be recipient). Marks as read.

### DELETE /api/messages/{message_id}
Auth required. Soft-deletes on the caller's side only.

### POST /api/events/{event_id}/notify-cancellation
Organizer (owner) only, event must be `CANCELLED`. Sends a system message to every
attendee with a booking on that event. Response `200`: `{ "notified": 42 }`.

---

## 7. Admin Export

### GET /api/admin/events/export?format=xml
Admin only. Returns all events as XML, exactly matching the assignment's DTD
(`Events > Event > Title, Category+, EventType, ... Bookings, Organizer, Status, Description, Media?`).

### GET /api/admin/events/export?format=json
Admin only. Same data as structured JSON.

---

## 8. Recommendations

### GET /api/recommendations
Auth required (`ATTENDEE`). Returns events the user hasn't booked yet, ranked by a
Biased Matrix Factorization model trained on the bookings dataset (+ `EventView` rows
for cold-start users with no bookings).

Response `200`:
```json
{
  "events": [ /* array of EventSummary, ranked best-first */ ],
  "cold_start": false
}
```
`cold_start: true` signals the ranking is based on view history only (no bookings yet),
so the frontend can label it "Because you viewed..." vs "Recommended for you".

---

## Role → Endpoint Access Summary

| Endpoint group              | GUEST | ATTENDEE | ORGANIZER | ADMIN |
|---|---|---|---|---|
| Register / Login            | ✅ | ✅ | ✅ | ✅ |
| Browse / search events      | ✅ | ✅ | ✅ | ✅ |
| Book tickets                | ❌ | ✅ | ❌ (own events only, not self-book) | ❌ |
| Create/edit/cancel events   | ❌ | ❌ | ✅ (own events) | ❌ |
| View bookings on own event  | ❌ | ❌ | ✅ | ❌ |
| Messaging                   | ❌ | ✅ | ✅ | ✅ |
| Approve/reject users        | ❌ | ❌ | ❌ | ✅ |
| Export XML/JSON             | ❌ | ❌ | ❌ | ✅ |
| Recommendations             | ❌ | ✅ | ❌ | ❌ |
