# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN npm install -g pnpm@11.1.0
WORKDIR /app

FROM base AS deps
# sharp traz binários pré-compilados (@img/sharp-*), então seu build script é
# um no-op. O pnpm 11 (strict-dep-builds) transforma "build ignorado" em erro
# fatal — desligamos para o no-op benigno não derrubar a imagem.
ENV PNPM_CONFIG_STRICT_DEP_BUILDS=false
COPY package.json ./
RUN pnpm install --no-frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# curl é exigido pelo healthcheck do Coolify (Portão 3) — roda o check DENTRO
# do container; a imagem alpine não traz curl/wget. Ver runbook 0003.
RUN apk add --no-cache curl
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
