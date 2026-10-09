ARG NODE_VERSION=22.21.1
ARG PNPM_VERSION=10.32.1

FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/packages/core/package.json ./apps/packages/core/package.json
COPY apps/worker/package.json ./apps/worker/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/packages/core/node_modules ./apps/packages/core/node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/packages/core ./apps/packages/core
COPY apps/worker ./apps/worker
RUN pnpm --filter @nailbook/core build
RUN pnpm --filter @nailbook/worker build || test -f apps/worker/dist/index.js

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/apps/packages/core/node_modules ./apps/packages/core/node_modules
COPY --from=deps --chown=nodejs:nodejs /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nodejs:nodejs /app/apps/packages/core/package.json ./apps/packages/core/package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/packages/core/dist ./apps/packages/core/dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/worker/dist ./apps/worker/dist

USER nodejs
WORKDIR /app/apps/worker
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 CMD node -e "process.exit(0)"
CMD ["node", "dist/index.js"]
