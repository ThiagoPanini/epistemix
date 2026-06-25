# ADR 0011 — Provedor de autenticação: better-auth (self-hosted)

- **Status:** Accepted
- **Data:** 2026-06-12
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0007](0007-publicar-e-papel-de-user.md), [ADR-0010](0010-desenvolvimento-autonomo-afk.md), [docs/CONTEXT.md](../CONTEXT.md)

## Contexto

A sessão de redesenho de 2026-06-12 deixou como decisão aberta o provedor de autenticação, com duas opções finalistas:

1. **Clerk** — SaaS gerenciado, UI pronta, zero infra a operar, mas pago em escala e com lock-in total.
2. **better-auth** — biblioteca TypeScript open-source (MIT), self-hosted, sem dependência de terceiro pago.

A stack já tem Postgres 17 (provisionado na sessão da issue #55) e um modelo `User` com `username` imutável (ADR-0007) e `role`. O escopo de auth da V1 é simples: e-mail/senha + sessão persistida. OAuth social fica para E0c (#61).

## Decisão

**Adotar better-auth.**

Configuração:
- Adapter: `pg` (node-postgres) no Next.js app; FastAPI valida sessões lendo o banco diretamente via SQLAlchemy.
- Tabelas prefixadas com `auth_` para evitar colisão com palavras reservadas do PostgreSQL (`user`) e manter namespace claro.
- Campos extras no `auth_user`: `username` (único, imutável), `role` (`user` | `admin`).
- `BETTER_AUTH_SECRET` gerado por máquina, setado via MCP (🟡), registrado na mensagem do commit/PR que o dispara.
- Leitura pública do catálogo não exige autenticação.

## Justificativa

| Critério | Clerk | better-auth |
|---|---|---|
| Custo | Gratuito até 10k MAU, depois pago | Gratuito (MIT) |
| Lock-in | Total (SaaS) | Zero (código e dados na nossa infra) |
| Infra a operar | Nenhuma | Tabelas no Postgres já existente |
| Auth flows V1 | Sim | Sim |
| SSO/OAuth social | Sim | Sim (E0c) |
| Self-hosted | Não | Sim |

O ethitorial é um hub pessoal público com um único publicador admin. O volume de usuários autenticados (comentaristas/votantes) é baixo. Pagar por um SaaS de auth para este volume não faz sentido estratégico.

## Consequências

### Positivas

- Zero custo de auth em qualquer escala.
- Todos os dados de sessão/usuário vivem no Postgres da plataforma.
- Schema versionado via Alembic (mesma pipeline de migration já em uso).
- FastAPI valida sessões sem depender de serviço externo — latência zero adicional.

### Negativas

- O app Next.js precisa de acesso direto ao Postgres (conexão separada da API).
- Atualizações de better-auth podem mudar o schema — migrations Alembic precisam ser revisadas.
- Emails transacionais (verificação, reset de senha) exigem um SMTP configurado (🔴 para produção; fora do escopo deste slice AFK).

## Opção rejeitada: Clerk

Clerk resolveria emails transacionais e UI de login prontos. Mas o lock-in total e o custo futuro incompatíveis com o caráter open-source e pessoal do projeto.
