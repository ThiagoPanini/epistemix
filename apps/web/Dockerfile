# syntax=docker/dockerfile:1
#
# Contexto de build = RAIZ do monorepo (não apps/web), porque o catálogo é
# MDX-native e lê `content/` (na raiz) em build-time/SSG — ADR-0018. O layout
# do container segue plano (app em /app) para o standalone do Next ficar plano
# e o estágio runner permanecer idêntico ao da Fase 0. Ver docker-compose.yml
# (context: . / dockerfile: apps/web/Dockerfile).

FROM node:24-alpine AS base
RUN npm install -g pnpm@11.1.0
WORKDIR /app

FROM base AS deps
# sharp traz binários pré-compilados (@img/sharp-*), então seu build script é
# um no-op. O pnpm 11 (strict-dep-builds) transforma "build ignorado" em erro
# fatal — desligamos para o no-op benigno não derrubar a imagem.
ENV PNPM_CONFIG_STRICT_DEP_BUILDS=false
COPY apps/web/package.json ./
RUN pnpm install --no-frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./
# content/ vem da raiz do contexto; só é necessário em build-time (SSG).
COPY content ./content
ENV NEXT_TELEMETRY_DISABLED=1
ENV EPISTEMIX_CONTENT_DIR=/app/content
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    EPISTEMIX_CONTENT_DIR=/app/content
# curl é exigido pelo healthcheck do Coolify (Portão 3) — roda o check DENTRO
# do container; a imagem alpine não traz curl/wget. Ver runbook 0003.
RUN apk add --no-cache curl
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
# content/ contém imagens de Source (capa, avatar) servidas em runtime pelo
# route handler app/content-assets/[...segments]/route.ts. Sem esta cópia,
# o handler retorna 404 em produção (a build stage descarta o FS do container).
COPY --from=build --chown=nextjs:nodejs /app/content ./content
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
