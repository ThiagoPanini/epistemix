# ADR 0023 — Comunicação interna app→app no Coolify exige Network Alias com o UUID

- **Status:** Accepted
- **Data:** 2026-06-24
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0003](0003-infra-hostinger-vps-coolify.md), [ADR-0006](0006-cloudflare-na-frente-da-vps.md), [ADR-0016](0016-vps-agnostica-multi-projeto.md), [AGENTS.md](../../AGENTS.md)

## Contexto

Abrir um post em produção (`ethitorial.panlabs.tech`) gastava ~5,5s de tela em branco. A investigação separou duas camadas:

- **Layer B (código):** a página de post bloqueava o render numa chamada server-side de comentários e faltava o route handler `/api/comments`. Corrigido e no ar (PRs #148, #149).
- **Layer A (infra):** mesmo com o Layer B, todo hop **web→api** levava ~5,5s fixos.

O diagnóstico do Layer A (via Coolify MCP + testes dentro dos containers) isolou a causa:

- `web→postgres` e `api→postgres` **resolvem** o UUID do banco (IPv6 ULA na rede `coolify`) e funcionam — por isso login/Better Auth e o `ping_db()` do `/health` sempre passaram.
- `web→api` **não resolvia**: `getent hosts <uuid-da-api>` retornava vazio (`wget: bad address`). O resolver musl (Alpine) espera ~5s antes de desistir → exatamente o atraso medido. A requisição nunca chegava na api (o log da api só tinha `/health` vindo de `127.0.0.1`), e o route handler caía no `catch` devolvendo `{ count: 0, voted: false }` — **indistinguível de "engajamento real = 0"**.

### Por que bancos funcionam e apps não

No Coolify, **bancos** recebem `container_name = <uuid>` por padrão (nome consistente), então o DNS embutido do Docker (`127.0.0.11`) resolve o UUID direto. **Apps do tipo Docker Image não** — o container ganha um sufixo aleatório, e o UUID só vira um alias resolvível na rede compartilhada `coolify` quando o campo **Network Aliases** (`custom_network_aliases`, [PR #4741](https://github.com/coollabsio/coolify/pull/4741)) é preenchido.

O toggle "Connect To Predefined Network" **não aparece na UI desta versão** para apps Docker Image (bug upstream [#5597](https://github.com/coollabsio/coolify/issues/5597)). O lever que existe é o input **Network Aliases**, em *General → Network*.

## Decisão

**Todo app que recebe chamadas internas por UUID deve ter o campo `Network Aliases` preenchido com o próprio UUID.**

Aplicado em `ethitorial-api`: `Network Aliases = y1iaroyitv1k9f46t4dssowt` (o mesmo host que o web já usa em `ETHITORIAL_API_URL=http://y1iaroyitv1k9f46t4dssowt:8000`), seguido de redeploy.

### Verificação (2026-06-24)

| Sinal | Antes | Depois |
|---|---|---|
| `getent hosts <uuid-api>` no container web | vazio (`bad address`) | `fd02:d0e1:6ae8::c` |
| `GET /api/votes/...` (prod, ponta-a-ponta) | ~5,5s travado | 0,19–0,70s |
| Log da api | só `/health` de `127.0.0.1` | `GET /api/votes 200` vindo do IP do web (`172.16.1.17`) |

Efeito: **engajamento (votos/views/comentários) passou a funcionar em produção** — antes tudo retornava zero silenciosamente.

## Consequências

### Positivas

- Chamadas internas web→api resolvem e respondem em sub-segundo (latência real de rede + query, não timeout de DNS).
- Fix declarativo na config do app, sem mudança de código.
- Causa e remédio documentados — o sintoma "lentidão" era na verdade um outage mascarado.

### Negativas / riscos

- O campo `Network Aliases` vive na configuração do Coolify, **não no repositório** — não é capturado por IaC nem pela CI. Depende de checklist humano/agente.
- Fallbacks silenciosos (`catch {}` → zeros) nos route handlers do web esconderam o outage por semanas. Recomendação registrada como follow-up: logar a falha server-side quando a chamada à api falhar (PR separado).

### Invariante de deploy

> Ao criar/wire um app interno (sem `fqdn`, chamado por outro app via UUID) no Coolify: **setar `Network Aliases = <uuid>` antes do wire-up.** Sem isso, o chamador queima ~5s num DNS morto e o erro fica mascarado.

## Nota: instância latente no `travelmanager`

Auditoria em 2026-06-24 encontrou `travelmanager-api` (Docker Image, `fqdn: null`, interno) com `Network Aliases` **vazio** — mesma armadilha. Ainda **não disparou** porque `travelmanager-web` não tem nenhum `*_API_URL` configurado (env vars vazias). Ação preventiva quando for ligar `travelmanager-web → travelmanager-api`: setar `Network Aliases = wn3lue477vpavm5xzda7lmas` antes.
