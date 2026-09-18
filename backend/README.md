# Eventify Backend

FastAPI + SQLAlchemy + SQLite REST API for the TED 2026 assignment (event management
and online booking system). For the full endpoint-by-endpoint contract (request/response
shapes, auth requirements), see [`API_CONTRACT.md`](../API_CONTRACT.md) at the repo root.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Running

```bash
uvicorn main:app --reload
```

The API is now at `http://localhost:8000`. Interactive docs (Swagger UI, auto-generated
by FastAPI from the code) are at `http://localhost:8000/docs` - useful both for manual
testing and as a live demo during the oral exam. A SQLite file `tedi.db` is created
automatically on first run in the `backend/` directory.

### Built-in admin account

Seeded automatically on first startup (assignment requirement: an admin account must
exist out of the box):

- **username:** `admin`
- **password:** `admin123`

Override via environment variables before starting the server:

```bash
export ADMIN_USERNAME=myadmin
export ADMIN_PASSWORD=a-real-password
```

Also set `JWT_SECRET_KEY` to something private for anything beyond local dev - it
defaults to a placeholder value in `auth.py`.

### Running over HTTPS (SSL/TLS)

The assignment requires all interactions to be SSL/TLS encrypted. The frontend already
has this covered for its own dev server via `@vitejs/plugin-basic-ssl` (see
`vite.config.js`). To match on the backend:

```bash
sh generate_dev_cert.sh          # one-time: creates key.pem + cert.pem for localhost
uvicorn main:app --reload --ssl-keyfile key.pem --ssl-certfile cert.pem
```

The API is then at `https://localhost:8000`. Your browser will warn about the
self-signed certificate the first time - that's expected for local development, not a
bug. `key.pem`/`cert.pem` are per-machine and already gitignored; each developer
generates their own. (For an actual deployment rather than local dev/demo, use a real
certificate from a CA, typically terminated at a reverse proxy such as nginx or Caddy
in front of uvicorn, rather than passing self-signed files directly to uvicorn.)

If you switch to HTTPS, update `API_BASE_URL` in the frontend's `src/api.js`
accordingly (`https://localhost:8000`), and note the CORS origins below.

### CORS

`main.py` allows `http://localhost:3000`, `http://localhost:3001`, and
`https://localhost:5173`. Vite's default dev port is `5173`; if the frontend runs
somewhere else (check the terminal output when you run `npm run dev`), add that origin
to the `origins` list in `main.py`.


## Design Decisions:

- **Registration role is restricted server-side** to `ATTENDEE`/`ORGANIZER` only -
  `ADMIN` cannot be self-registered; it only exists via the seeded account.
- **`ticket_type_id` is globally unique in the DB** (`EV1024-T1`), not scoped per event,
  because it's a single primary-key column. The DTD only requires uniqueness *within*
  one event, so the XML/JSON export strips the event-id prefix back down to the DTD's
  local form (`T1`) - see `crud._local_ticket_type_id`.
- **Booking availability is enforced with a single atomic SQL `UPDATE ... WHERE
  available >= N`**, not a read-then-write check, so two simultaneous bookings for the
  last seat can't both succeed. This was verified under genuine concurrent load (10
  simultaneous requests against 2 remaining seats -> exactly 2 succeeded, 8 got a clean
  `409`, availability never went negative), not just reasoned about.
- **Messaging is scoped to an organizer<->attendee pair that shares a booking** on the
  relevant event (`crud.verify_messaging_relationship`), matching the assignment's own
  framing of messaging as a post-booking feature - not open messaging between any two
  users.
- **The recommender trains fresh on every request** rather than being cached/scheduled,
  since it's fast enough at realistic scale (~130ms with ~16 users/16 events/112
  interactions) for a project of this size. If usage ever grows enough for that to
  matter, the natural next step is caching the trained model for a few minutes rather
  than retraining per-request - not implemented, since it wasn't needed yet.
- **The recommender's `n_factors` scales down automatically on very small/sparse data**
  (`crud.get_recommendations`), because a fixed large factor count is *underdetermined*
  on a handful of interactions - many different parameter settings fit tiny training
  data equally well without generalizing the same way. This isn't just theoretical:
  testing at toy scale (3 users per preference group) showed real unreliability that
  scaling up to a realistic size (8 users per group) resolved cleanly, matching the
  proven-reliable result from `recommender_demo.py`. Worth mentioning directly if asked
  about limitations - it's an honest, well-understood property of matrix factorization
  at extreme sparsity, not a flaw specific to this implementation.


## Step by step of backend design:

The backend was developed independently of the front end at the start of the assignment, split into the following steps:

### Step 1 — Data model & API contract
This step established the relational schema as SQLAlchemy models and defined the full
REST API surface up front. I began by writing `API_CONTRACT.md` before touching most of the
actual endpoint code, so my partner had a stable interface to build the frontend
against without needing to wait for the backend to be finished first. 

### Step 2 — Auth & RBAC
Iimplemented user registration with admin-approval, login via JWT (chose JWT for simplicity), and a
built-in  admini account, along with the permission system distinguishing
guest, attendee, organizer, and admin access throughout the API. Split
role-checking into a reusable `require_role(...)` factory rather than one function per
role, and deliberately made registration reject `role: "ADMIN"` server-side for security purposes.

### Step 3 — Events CRUD & capacity validation
Built full CRUD for events, along with the ticket-type system and the rule that ticket quantities can
never exceed an event's total capacity. It covers the event lifecycle (draft →
published → cancelled) and the constraints on when an event can be edited, cancelled,
or removed entirely.

### Step 4 — Search & browsing
This step added public event discovery: filtering by category, free-text search across
title and description, date range, price range, and location, with paginated results.


### Step 5 — Booking system
Implemented ticket booking for attendees, including real-time availability
checks and safe handling of simultaneous booking attempts for the same limited stock.


### Step 6 — Messaging
This step added a messaging system between organizers and attendees who share a
booking, including inbox and sent views, read/unread tracking, message deletion, and
automatic notifications to all affected attendees when an event is cancelled.

### Step 7 — Data export
This step implemented administrator-only export of all event data in both XML and JSON format. It covers every event regardless of status, with nested ticket
type, booking, and media information included in the output.

### Step 8 — Recommendation engine
Implemented the Biased Matrix Factorization recommendation algorithm from
scratch using plain numpy, trained on each attendee's booking and viewing history to
suggest relevant events. It covers model training, cold-start handling for new users,
and validation of the algorithm's correctness against both synthetic data and the
dataset.


  
