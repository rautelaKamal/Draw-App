# The frontend is compiled, unlike the backends: `next build` produces the
# bundle that `next start` serves.
FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/excelidraw-frontend/package.json apps/excelidraw-frontend/
COPY apps/http-backend/package.json apps/http-backend/
COPY apps/ws-backend/package.json apps/ws-backend/
COPY apps/web/package.json apps/web/
COPY packages/backend-common/package.json packages/backend-common/
COPY packages/common/package.json packages/common/
COPY packages/db/package.json packages/db/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/excelidraw-frontend/ apps/excelidraw-frontend/

# These are baked into the client bundle at build time, not read at runtime,
# so they arrive as build args. Pointing them somewhere else means rebuilding
# the image, not restarting the container.
ARG NEXT_PUBLIC_HTTP_BACKEND
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_HTTP_BACKEND=$NEXT_PUBLIC_HTTP_BACKEND
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

RUN pnpm --filter excelidraw-frontend build

WORKDIR /app/apps/excelidraw-frontend
CMD ["pnpm", "start"]
