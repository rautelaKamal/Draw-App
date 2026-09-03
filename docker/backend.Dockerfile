# Shared recipe for both backends: they differ only by which app directory
# they run, so the app name comes in as a build arg.
#
# Nothing is compiled here. The workspace packages (@repo/db, @repo/common,
# @repo/backend-common) export raw TypeScript rather than build output, so the
# runtime has to read TS directly -- which is what tsx does.
FROM node:20-alpine

ARG APP
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Manifests first: this layer is cached until a dependency actually changes,
# so editing source does not trigger a reinstall. pnpm validates the lockfile
# against every workspace project, so all of them have to be present.
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
COPY apps/${APP}/ apps/${APP}/

# The Prisma client is generated code, so it has to be produced inside the
# image rather than copied from the host.
RUN pnpm --filter @repo/db exec prisma generate

WORKDIR /app/apps/${APP}
CMD ["pnpm", "start"]
