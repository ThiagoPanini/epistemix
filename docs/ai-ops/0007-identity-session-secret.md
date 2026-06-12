---
data: 2026-06-12
operacao: geração e aplicação do session secret do better-auth + DATABASE_URL para o web app
maquina: panini-vps (Hostinger KVM 2, Ubuntu 24.04 LTS)
operador: Thiago Panini
agente: Claude Code (issue #53)
resultado: BETTER_AUTH_SECRET setado nas duas apps; DATABASE_URL setado na web; apps redeploy pendente
referencias:
  issue: "#53"
  adr: "../adr/0020-auth-better-auth.md"
  ai-ops-anterior: "0006-postgres-engagement-schema.md"
---

# 20260612 — better-auth session secret + DATABASE_URL web

Geração do `BETTER_AUTH_SECRET` para o sistema de autenticação better-auth (issue #53).

## O que foi feito (🟡 agente autônomo)

- Gerado `BETTER_AUTH_SECRET` via `python3 -c "import secrets; print(secrets.token_urlsafe(64))"`
- Setado `BETTER_AUTH_SECRET` em runtime-only nas duas apps via MCP:
  - `epistemix-api` (uuid `y1iaroyitv1k9f46t4dssowt`) — env_var uuid `x1judkbj5r61u315jnb6eazp`
  - `epistemix-web` (uuid `kd4niwj9bzp2m7cwz0579ktk`) — env_var uuid `d11y9nwxpika64urqzdpqs57`
- Setado `DATABASE_URL` (formato `postgres://`, Node.js) no `epistemix-web` — env_var uuid `igygwpr3b5s0or8tllwww4tf`
  - Mesma senha/host do Postgres provisionado em `0006-postgres-engagement-schema.md`
  - Formato sem `+asyncpg` (que é específico do driver Python)
- Setado `BETTER_AUTH_URL=https://epistemix.dev` no `epistemix-web` — env_var uuid `u7yj4n59ozvo9g8flxtdobon`

## Segredos

- **`BETTER_AUTH_SECRET`**: gerado por máquina (token_urlsafe 64 bytes). Idêntico nas duas apps. Nunca commitado.
- **`DATABASE_URL` web**: mesma senha do Postgres de `0006`. Nunca commitada.

## Pendência: SMTP para e-mails transacionais

better-auth envia e-mails de verificação e reset de senha. Sem SMTP configurado, essas rotas retornam erro. Para produção completa, configurar:

```
BETTER_AUTH_EMAIL_FROM=noreply@epistemix.dev
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...  # segredo de terceiro → 🔴, operador aplica manualmente
```

Fora do escopo do slice AFK E0a. Login funciona sem SMTP se `emailAndPassword.requireEmailVerification` for `false` (default).
