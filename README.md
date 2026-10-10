# Draw App

A collaborative whiteboard. Multiple people join a room and draw shapes on a
shared canvas, and every stroke appears for everyone in real time.

## Running it with Docker

One command brings up the whole stack — Postgres, both backends, and the
frontend. Nothing needs to be installed except Docker.

```bash
cp .env.example .env      # then edit JWT_SECRET
docker compose up --build
```

Then open http://localhost:3000.

| Service | Port | What it does |
| --- | --- | --- |
| `frontend` | 3000 | Next.js app — auth pages, room picker, canvas |
| `http-backend` | 3001 | REST — signup, signin, rooms, shape history |
| `ws-backend` | 8080 | WebSocket — joins rooms, broadcasts and stores shapes |
| `postgres` | 5433 | Database (5433 on the host, since 5432 is often taken) |
| `migrate` | — | Runs `prisma migrate deploy` once, then exits |

Migrations run automatically: `migrate` applies the schema and the backends
wait for it to finish, so a fresh clone never starts against an empty database.

Useful commands:

```bash
docker compose logs -f ws-backend   # follow one service
docker compose down                 # stop everything
docker compose down -v              # stop and wipe the database
```

### Notes on the setup

**Nothing is compiled in the backend images.** The workspace packages
(`@repo/db`, `@repo/common`, `@repo/backend-common`) export raw TypeScript
rather than build output, so the runtime reads TS directly via `tsx`. Both
backends share `docker/backend.Dockerfile`, which takes the app name as a
build arg since that is all that differs between them.

**The frontend's backend URLs are baked in at build time.** Next inlines
`NEXT_PUBLIC_*` into the client bundle, so they are build args rather than
runtime environment variables — pointing the app at a different backend means
rebuilding the image, not restarting the container. They are set to
`localhost:3001` and `localhost:8080` because that code runs in the browser,
not inside the Docker network, so compose service names would not resolve.

## Running it without Docker

Needs Node 20+, pnpm 9, and a Postgres instance.

```bash
pnpm install
cp packages/db/.env.example packages/db/.env
cd packages/db && npx prisma migrate dev && cd ../..

pnpm --filter http-backend dev        # :3001
pnpm --filter ws-backend dev          # :8080
pnpm --filter excelidraw-frontend dev # :3000
```

## Architecture

Three services, split deliberately. REST requests are short and stateless, so
they scale horizontally with no coordination. WebSocket connections are
long-lived and pin a user to one process, so that server is bound by
concurrent connections instead. Separating them means each scales on its own
axis, and a crash in the socket layer does not take down login.

Drawings are stored as an **append-only log** rather than as canvas state.
Every shape is one row, and the canvas is rebuilt by replaying them. Appends
from different users never conflict, and erasing appends a tombstone naming a
shape id rather than deleting anything — so erasing twice is harmless and the
log stays immutable.

The trade-off is that the log grows forever and replay is O(n). Reads are
capped at the most recent 1000 shapes; the real fix is periodic snapshotting.

## Known gaps

- JWTs expire after seven days but cannot be revoked before that. Logging
  someone out immediately needs short-lived access tokens plus a refresh token,
  or a revocation list.
- **There is no real authorization, only authentication.** Room ids are
  sequential integers, signing up is free, and `join_room` accepts any id, so
  any signed-up user can read any room by counting upward. This is not the
  "anyone with the link" model: an Excalidraw link carries a long random secret
  that cannot be guessed, while this one carries the number 5. The two fixes
  are an unguessable random slug in the URL, which keeps sharing as simple as
  passing a link, or a `RoomMember` table checked on join and on `/chats`,
  which is real access control but needs invite and removal flows.
- `ws-backend` keeps connections in a module-level array, so it only runs as a
  single instance. Multiple instances need Redis pub/sub to fan out across
  processes.
- Replay is capped at the most recent 1000 rows, and erase tombstones count
  toward that cap, so a very busy room can lose its oldest shapes on reload.
  The fix is periodic snapshotting: store the computed board every N events and
  replay only what came after.
- Live order and reload order can differ. Two concurrent writes are broadcast
  in whichever order finishes first, while replay orders by row id, so the
  z-order of two simultaneous strokes can swap after a refresh.
- No automated tests. The replay and tombstone logic is the obvious first one.

## Origin

Started from the 100xDevs cohort's collaborative whiteboard project, which is a
chat server repurposed to carry shapes. That is why messages are stored in a
`Chat` table and the socket message type for a shape is `chat`.

What I added on top: the real authentication flow replacing a hardcoded token,
the room create and join flow, the eraser built on append-only tombstones with
hit testing inside shapes, de-duplication of echoed shapes, password hashing
with bcrypt, Zod validation and authorization on the socket layer, a Docker
Compose stack with a one-shot migration service, and a single-port production
deploy where the WebSocket server mounts onto the HTTP server.
