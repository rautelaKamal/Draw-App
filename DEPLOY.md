# Deploying to Railway

Four services: Postgres, `http-backend`, `ws-backend`, `frontend`.

**Deploy in the order below.** The frontend compiles the backend URLs into its
JavaScript bundle at *build* time, so the backends need public domains before
the frontend is built. Building it first bakes in `localhost` and the deployed
site will fail to reach the API.

---

## 1. Create the project and database

1. On [railway.app](https://railway.app), create a project and connect this
   GitHub repo.
2. **Add a Postgres database** (New -> Database -> Postgres). Railway creates a
   `DATABASE_URL` you reference from the other services.

## 2. Generate a JWT secret

The backends refuse to boot in production without one — that is deliberate, so
a missing secret fails loudly instead of falling back to a value published in
this repo. Generate a real one:

```bash
openssl rand -base64 32
```

Keep it. Both backends must use the **same** value, or tokens signed by the
HTTP API will not verify on the socket server.

## 3. Deploy `http-backend`

New -> GitHub Repo -> this repo. Then in the service settings:

- **Config as code path:** `railway/http-backend.json`
- **Variables:**

  | Name | Value |
  |---|---|
  | `APP` | `http-backend` |
  | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
  | `JWT_SECRET` | the value from step 2 |
  | `NODE_ENV` | `production` |

- **Networking -> Generate Domain.** Note the URL, e.g.
  `https://http-backend-production.up.railway.app`.

`APP` is consumed as a Docker build argument — one Dockerfile builds either
backend, and this selects which. The start command runs
`prisma migrate deploy` before booting, so the schema is applied on every
deploy.

## 4. Deploy `ws-backend`

Another service from the same repo:

- **Config as code path:** `railway/ws-backend.json`
- **Variables:**

  | Name | Value |
  |---|---|
  | `APP` | `ws-backend` |
  | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
  | `JWT_SECRET` | **the same value as step 3** |
  | `NODE_ENV` | `production` |

- **Generate Domain.** Note the URL.

Only `http-backend` runs migrations. Both services share one schema, and two
processes migrating the same database concurrently can deadlock.

## 5. Deploy `frontend`

Last, now that both backend URLs exist:

- **Config as code path:** `railway/frontend.json`
- **Variables:**

  | Name | Value |
  |---|---|
  | `NEXT_PUBLIC_HTTP_BACKEND` | `https://<your http-backend domain>` |
  | `NEXT_PUBLIC_WS_URL` | `wss://<your ws-backend domain>` |

  **`wss://`, not `ws://`.** The page is served over HTTPS, and browsers block
  an insecure WebSocket opened from a secure page as mixed content — silently,
  with nothing in the network tab. Railway terminates TLS for you, so the
  scheme is the only change. No port number: `wss://host`, not `wss://host:8080`.

- **Generate Domain.** This is your live URL.

## 6. Close the CORS hole

Back in **`http-backend`**, add one more variable:

| Name | Value |
|---|---|
| `CORS_ORIGIN` | `https://<your frontend domain>` |

Without it the API accepts requests from any origin, meaning any website could
call it with a logged-in user's token. Redeploy after setting it.

---

## Verifying

1. Open the frontend URL, sign up, sign in.
2. Create a room — confirms the API, the database, and migrations.
3. Draw a shape, then reload — confirms the socket and persistence.
4. Open the same room in a second browser and draw. Both should update live.

If step 4 fails while 1-3 pass, the WebSocket is the problem: check
`NEXT_PUBLIC_WS_URL` uses `wss://` and carries no port.

## Redeploying after a URL change

`NEXT_PUBLIC_*` values are compiled into the bundle, so changing them requires
a **rebuild**, not a restart. After editing either, trigger a redeploy of the
frontend or the old URL stays baked in.

## Known gaps in production

Real limitations, worth knowing before showing this to anyone:

- **Passwords are stored in plaintext.** Do not reuse a real password.
- **Tokens never expire** and cannot be revoked.
- **The socket server holds connection state in memory**, so it cannot run more
  than one replica — a second instance would not see the first one's clients.
  Scaling horizontally needs Redis pub/sub for the fan-out.
- **Any signed-in user can join any room** by guessing its integer id, and
  `GET /chats/:roomId` needs no token at all.
