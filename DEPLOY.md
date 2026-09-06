# Deploying (free)

Three platforms, each free with no expiry:

| Piece | Platform | Notes |
|---|---|---|
| Postgres | **Neon** | Free, persistent |
| Backend (API + WebSocket) | **Koyeb** | One free instance; sleeps after 1h idle |
| Frontend | **Vercel** | Free, never sleeps |

Both backends run as **one** Koyeb service: a free instance exposes a single
port, so `http-backend` mounts the socket server on its own HTTP server at
`/ws`. That is what `WS_EMBEDDED=1` below switches on. Locally nothing
changes — `docker compose up` still runs them as two separate services.

**Deploy in this order.** The frontend compiles the backend URL into its
JavaScript bundle at *build* time, so the backend needs a public domain first.
Building the frontend early bakes in `localhost` and the live site cannot reach
the API.

---

## 1. Database — Neon

1. Sign up at [neon.tech](https://neon.tech), create a project.
2. Copy the connection string. It looks like:
   `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`

Keep `?sslmode=require` — Neon rejects unencrypted connections.

## 2. Generate a JWT secret

```bash
openssl rand -base64 32
```

The backend refuses to boot in production without one. That is deliberate: a
missing secret fails loudly instead of silently falling back to a value that is
public in this repo.

## 3. Backend — Koyeb

Create a Web Service from this GitHub repo.

- **Builder:** Dockerfile
- **Dockerfile path:** `docker/backend.Dockerfile`
- **Build argument:** `APP` = `http-backend`
- **Exposed port:** `8000` (Koyeb's default; the app reads `PORT`)
- **Environment variables:**

  | Name | Value |
  |---|---|
  | `APP` | `http-backend` |
  | `WS_EMBEDDED` | `1` |
  | `DATABASE_URL` | the Neon string from step 1 |
  | `JWT_SECRET` | the value from step 2 |
  | `NODE_ENV` | `production` |

`APP` is needed in **both** places — as a build argument (it selects which
backend the shared Dockerfile builds) and as an environment variable.

Deploy, then note the public domain, e.g.
`https://draw-app-yourname.koyeb.app`.

### Apply the database schema

The container has the Prisma CLI. From Koyeb's console/shell for the service:

```bash
cd /app && pnpm --filter @repo/db exec prisma migrate deploy
```

If the service has no shell, run it from your machine against Neon instead:

```bash
cd packages/db && DATABASE_URL="<your neon string>" npx prisma migrate deploy
```

### Check it

```bash
curl https://<your koyeb domain>/room/anything
```

`{"room":null}` means the API and the database are both working. An error
mentioning a relation or table means migrations have not run.

## 4. Frontend — Vercel

Import the repo at [vercel.com](https://vercel.com).

- **Root Directory:** `apps/excelidraw-frontend`
- Enable **Include source files outside of the Root Directory** — the app
  depends on `@repo/ui` and `@repo/common`, which live above it.
- **Environment variables:**

  | Name | Value |
  |---|---|
  | `NEXT_PUBLIC_HTTP_BACKEND` | `https://<your koyeb domain>` |
  | `NEXT_PUBLIC_WS_URL` | `wss://<your koyeb domain>/ws` |

Two details in that second value that both fail silently if wrong:

- **`wss://`, not `ws://`.** The page is served over HTTPS and browsers block
  an insecure socket opened from a secure page as mixed content — with nothing
  in the network tab to explain it.
- **`/ws` on the end, and no port number.** That is the path the socket server
  is mounted at. `wss://host/ws`, never `wss://host:8080/ws`.

Deploy. The Vercel URL is your live link — the only one that goes on a CV.

## 5. Close the CORS hole

Back on **Koyeb**, add one more environment variable and redeploy:

| Name | Value |
|---|---|
| `CORS_ORIGIN` | `https://<your vercel domain>` |

Without it the API accepts requests from any origin, so any website could call
it with a logged-in user's token.

---

## Verifying

1. Open the Vercel URL, sign up, sign in.
2. Create a room — exercises the API, the database, and migrations.
3. Draw a shape, reload — exercises the socket and persistence.
4. Open the same room in a second browser and draw in one. Both should update.

If 1-3 pass but 4 fails, it is the socket: check `NEXT_PUBLIC_WS_URL` is
`wss://`, ends in `/ws`, and has no port.

## Things that will confuse you later

**Changing a `NEXT_PUBLIC_*` value needs a rebuild, not a restart.** Those
values are compiled into the bundle. Redeploy the frontend after editing one or
the old value stays baked in.

**The first request after an idle hour takes ~30 seconds.** Koyeb's free
instance scales to zero. Vercel does not, so the page loads instantly and only
signing in feels slow. Before showing this to anyone, open it a couple of
minutes early to wake the backend.

## Known gaps in production

Real limitations, worth knowing before sharing the link:

- **Passwords are stored in plaintext.** Do not reuse a real password.
- **Tokens never expire** and cannot be revoked.
- **One instance only.** Connection state lives in memory, so a second replica
  would not see the first one's clients. Scaling out needs Redis pub/sub.
- **Any signed-in user can join any room** by guessing its integer id, and
  `GET /chats/:roomId` requires no token at all.
- **API and socket share a process**, so a crash takes down both. Splitting
  them again is a config change — unset `WS_EMBEDDED` and deploy `ws-backend`
  separately.

## Alternative: Railway (paid)

`railway/*.json` holds config for deploying the three services separately on
Railway — always-on, no cold start, one dashboard, around $5/month once the
trial credit runs out. Worth it if the cold start ever becomes a problem; the
free path above is otherwise equivalent.
