# ADR 0016 — VPS agnóstica: infra desacoplada de um único projeto

- **Status:** Accepted
- **Data:** 2026-05-31
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** complementa [ADR-0003](0003-infra-hostinger-vps-coolify.md) e [ADR-0006](0006-cloudflare-na-frente-da-vps.md); motivado por [ADR-0015](0015-epistemix-domain-model.md) (pivô `talkingpres` → `epistemix`)

## Contexto

O ADR-0003 provisionou uma VPS Hostinger com Coolify e o ADR-0006 colocou a Cloudflare na frente — ambos escritos quando o projeto se chamava `talkingpres` e era a única coisa que a máquina hospedaria. Esse pressuposto vazou para a nomenclatura concreta da infra:

- hostname `talkingpres-prod`
- chave SSH `~/.ssh/talkingpres_ed25519`
- prefixo de segredos `talkingpres/` no gerenciador
- caderno local `~/secrets/talkingpres-bootstrap.md`
- arquivo `/etc/apt/apt.conf.d/52talkingpres-unattended-upgrades`
- zona DNS única `talkingpres.com` (planejada; nunca chegou a ser migrada — ver [ai-ops 0001](../ai-ops/0001-setup-inicial-talkingpres-prod.md))

Com o pivô para `epistemix` (ADR-0015) e a intenção declarada de construir **outros projetos depois**, a premissa "uma VPS = um projeto" deixou de valer. Renomear a infra de `talkingpres` para `epistemix` apenas trocaria um acoplamento por outro. A decisão correta é tornar a camada de infra **agnóstica ao projeto**: ela é um substrato compartilhado, não pertence a `epistemix` nem a nenhum projeto futuro.

## Decisão

**A VPS é infraestrutura compartilhada, não um projeto.** Sua nomenclatura usa um namespace pessoal neutro — `panini-vps` — desacoplado de qualquer projeto hospedado.

### 1. Nomenclatura agnóstica

| Recurso | Antes (acoplado) | Depois (agnóstico) |
|---|---|---|
| Hostname | `talkingpres-prod` | `panini-vps` |
| Chave SSH local | `~/.ssh/talkingpres_ed25519` | `~/.ssh/panini_vps_ed25519` |
| Caderno de bootstrap | `~/secrets/talkingpres-bootstrap.md` | `~/secrets/panini-vps-bootstrap.md` |
| Prefixo de segredos | `talkingpres/` | `panini-vps/` |
| Unattended-upgrades | `52talkingpres-unattended-upgrades` | `52panini-vps-unattended-upgrades` |
| Bucket R2 de backups | `talkingpres-backups` | `panini-vps-backups` |
| Tokens Cloudflare de infra | `talkingpres-mcp-*` | `panini-vps-mcp-*` |
| Alias SSH (`~/.ssh/config`) | — | `Host panini-vps` |

O sufixo `-prod` foi abandonado em favor de `panini-vps` puro: havendo uma única máquina, ambiente não é eixo de nomeação. Se um dia existir `panini-vps-staging`, o sufixo volta com sentido real.

### 2. Um Coolify, N projetos

A instância única de Coolify hospeda **múltiplos projetos**. O isolamento se dá em três eixos:

- **Coolify Project** — cada projeto vira um *Project* no Coolify, com seus próprios apps/recursos. Não compartilham configuração de deploy.
- **Domínio/zona** — cada projeto tem sua própria zona DNS na Cloudflare (ex.: `epistemix.*` para o epistemix; o painel do Coolify fica num subdomínio de uma zona de infra neutra, não na zona de nenhum projeto-produto).
- **Banco** — bancos Postgres separados por projeto (mesmo servidor Postgres do Coolify, *databases* distintas), para que um projeto não leia dados de outro.

### 3. Cloudflare multi-zona

O ADR-0006 descreveu uma zona única (`talkingpres.com`) atrás da Cloudflare. Generaliza-se para **N zonas sob a mesma conta Cloudflare**, todas apontando para o mesmo IP de origem (a VPS), todas com `Full (Strict)` e origem fechada aos ranges Cloudflare. O modelo de borda (proxy, WAF, CDN, R2) do ADR-0006 vale idêntico por zona; só deixa de haver "a zona do projeto" e passa a haver "as zonas dos projetos".

### 4. Backups compartilhados, isolados por caminho

Bucket R2 único de backups (`panini-vps-backups`) com prefixos por projeto (`<projeto>/postgres/...`). Evita proliferar buckets; mantém isolamento lógico por path e credenciais escopadas.

## Consequências

### Positivas

- Próximos projetos entram na mesma VPS **sem renomear nada de infra** — só criam um Coolify Project, uma zona e (se preciso) um database.
- A documentação de infra (guides, runbooks, ai-ops futuros) descreve uma máquina, não um produto: reusável a cada projeto novo.
- O pivô de nome do produto (e futuros pivôs) não toca mais a camada de infra.

### Negativas

- **Blast radius compartilhado.** Um projeto que derrube a VPS (CPU/RAM, disco cheio, deploy ruim) afeta os outros. Aceitável enquanto o conjunto for pequeno e pessoal; isolamento real (uma VPS por projeto, ou cgroups/limits no Coolify) fica como gatilho de revisão se a contenção doer.
- **Segredos coabitam.** O prefixo `panini-vps/` guarda segredos de infra; segredos *de aplicação* de cada projeto devem usar prefixo próprio (`<projeto>/`) para não misturar escopos.
- **Custo de migração único** — renomear hostname, chave, configs e segredos (executado em [ai-ops 0003](../ai-ops/0003-generalizar-vps-panini.md)).

## O que isto NÃO muda

- A escolha de Hostinger + Coolify + Cloudflare + R2 (ADR-0003/0006) permanece.
- O hardening base (ssh-key-only, ufw, fail2ban, unattended-upgrades) permanece — só o **nome** do arquivo de unattended-upgrades muda.
- A regra "VPS única é SPOF, HA fica para depois" (ADR-0003) permanece, agora valendo para todos os projetos coabitantes.

## Gatilho de revisão

- Quando um projeto coabitante exigir isolamento forte (compliance, blast radius inaceitável), reabrir para decidir entre limites no Coolify ou VPS dedicada por projeto.
- Quando o número de projetos/zonas tornar a conta Cloudflare free um gargalo (limites de regras/zonas).

## Migração

A operação concreta de renomeação na máquina e nos artefatos locais está registrada em [ai-ops 0003 — Generalização da VPS](../ai-ops/0003-generalizar-vps-panini.md). A migração dos itens no gerenciador de segredos (`talkingpres/` → `panini-vps/`) é manual e fica pendente até a CLI do gerenciador estar disponível na sessão.
