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

## Architecture

| File | Responsibility |
|---|---|
| `models.py` | SQLAlchemy ORM models - the relational schema, mapped to Python classes (assignment's explicit "REST backend maps the relational DB to an object-oriented model" requirement). |
| `schemas.py` | Pydantic request/response schemas - what the API actually accepts and returns, independent of the DB shape. |
| `database.py` | SQLite engine/session setup, plus a registered SQL function (`unaccent_lower`) for accent/case-insensitive Greek text search. |
| `auth.py` | Password hashing (bcrypt), JWT issuing/verification, and the role-based-access-control dependencies (`require_admin`, `require_organizer`, `require_attendee`, etc.) used throughout `main.py`. |
| `crud.py` | All business logic: ID generation, capacity/availability validation, event search, XML/JSON export, the recommender's DB integration. Kept separate from `main.py` so routes stay thin and this logic is unit-testable on its own. |
| `main.py` | FastAPI app + every route. Thin wiring layer over `crud.py`/`auth.py`. |
| `recommender.py` | The Biased Matrix Factorization algorithm itself - pure numpy, no recommender libraries, implemented from scratch per the assignment's explicit requirement. Deliberately has no database dependency so it can be tested/demonstrated standalone. |
| `recommender_demo.py` | Standalone correctness proof: synthetic data with *known* structure (two user clusters with opposite preferences), checked against what the trained model actually learned. Run with `python3 recommender_demo.py`. |
| `recommender_eclass_dataset_eval.py` | Rigorous train/test evaluation on the real dataset provided for the assignment (`event_interest.csv`) - proper 80/20 split, RMSE against two baselines, pairwise ranking accuracy. Expects the dataset at `/home/claude/dataset/rel_event_csvs/event_interest.csv` by default; **update `DATA_PATH` at the top of the file** to wherever you place the provided CSVs locally. Run with `python3 recommender_eclass_dataset_eval.py`. |
| `generate_dev_cert.sh` | One-time local HTTPS certificate generation (see above). |

## Key design decisions worth knowing for the write-up / oral exam

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
