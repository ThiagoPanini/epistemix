# ADR 0003 — Infra: VPS Hostinger + Coolify + Cloudflare

- **Status:** Accepted
- **Data:** 2026-05-23
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0002](0002-stack-fastapi-nextjs-postgres.md), [ADR-0006](0006-cloudflare-na-frente-da-vps.md)

## Contexto

Precisamos decidir onde e como hospedar `apps/web`, `apps/api`, banco e assets. Restrições:

- Solo dev com ambição comercial; ops é responsabilidade única
- Open source dia 1 — preferência por componentes FOSS
- Custo previsível importa mais que escalabilidade infinita
- Usuário declarou que **vai usar VPS Hostinger** (decisão de plataforma já tomada)
- Setup AI-first não deve ser prejudicado por escolha de infra

## Decisão

**Provisionar VPS Hostinger (alvo: KVM 2 — 2 vCPU, 8 GB RAM, 100 GB NVMe)** com Ubuntu 24.04 LTS.

**Orquestrar via Coolify** (PaaS auto-hospedado open source). Coolify gerencia:
- Traefik (default do Coolify) como reverse proxy com SSL automático (Let's Encrypt)
- Build e deploy dos containers `apps/web` e `apps/api`
- PostgreSQL 17 como serviço gerenciado pelo Coolify, com volume persistente
- Preview environments por PR
- Backups Postgres diários

**Cloudflare** como camada na frente da VPS:
- DNS autoritativo
- Proxy + CDN para assets estáticos
- WAF + DDoS protection
- Esconde IP da origem

**Cloudflare R2** para assets de usuário e backups (zero egress fees).

**Deploy:** GitHub Actions builda imagens → push para GHCR → Coolify recebe webhook → puxa imagem e faz rolling restart com health checks.

### Substrato compartilhado: `panlabs.tech` como guarda-chuva multi-projeto

A VPS é **infraestrutura compartilhada, não um projeto**. Três camadas de nomeação convivem:

- **Umbrella público — `panlabs.tech`.** A vitrine pública do portfólio. Cada projeto é um subdomínio próprio; o `ethitorial` é `ethitorial.panlabs.tech`, com zona DNS própria na conta Cloudflare.
- **Infra do operador.** Painel Coolify em `vps.panlabs.tech`; namespace neutro `panini-vps` (hostname, chave SSH, prefixo de segredos de infra, bucket de backups, tokens de infra); imagens em `ghcr.io/thiagopanini/`. É encanamento — desacoplado de qualquer projeto e fora da marca. O sufixo `-prod` é dispensado: com uma única máquina, ambiente não é eixo de nomeação.
- **Isolamento por projeto.** Uma única instância de Coolify hospeda **N projetos**, isolados em três eixos: um *Coolify Project* por projeto; uma zona DNS própria por projeto (todas apontando para o IP da VPS, `Full (Strict)`, origem fechada aos ranges Cloudflare); *databases* Postgres separadas no mesmo servidor. Backups num bucket R2 único com prefixo por projeto (`<projeto>/postgres/...`). Segredos de infra moram em `panini-vps/`; segredos de aplicação usam prefixo próprio (`<projeto>/`).

**Blast radius é compartilhado** — um projeto que derrube a VPS derruba os vizinhos (panlabs et al.). Isso é **aceito deliberadamente porque o portfólio é experimental, solo e de baixo risco**: sem usuários ativos relevantes, downtime é quase irrelevante e a autonomia operacional vale mais que o isolamento (ver [ADR-0010](0010-desenvolvimento-autonomo-afk.md)). Isolamento forte — multi-tenant, ou VPS/ambiente dedicado por projeto — é o **gatilho de revisão** para quando um projeto ganhar usuários reais ou SLA.

## Justificativa

**VPS Hostinger:** decisão do usuário. Custo fixo (~$5-15/mês), controle total, alinhado com perfil SRE/learning.

**Coolify (vs. docker-compose puro):**
- Vercel-like DX sem perder controle
- SSL e routing automáticos eliminam classe inteira de bugs de prod
- Preview por PR mantém o fluxo AI-first produtivo (Claude pode validar mudança em ambiente real antes do merge)
- Backups automáticos resolvem item crítico que solo dev sempre adia
- Open source — alinhado com o espírito do projeto

**Cloudflare na frente:**
- Praticamente obrigatório para SaaS público em VPS única
- Reduz egress da VPS (cache de assets)
- Free tier cobre carga de V1 e V2 confortavelmente

**Cloudflare R2 para assets:**
- Zero egress fee elimina surpresa de billing quando viralizar
- S3-compatible API funciona com qualquer SDK
- Backups Postgres no mesmo lugar, custo desprezível

## Consequências

### Positivas
- Custo previsível (~$10-25/mês total)
- Sem vendor lock-in significativo (Coolify pode rodar em qualquer VPS; tudo é container; backups portáveis)
- DX próxima de Vercel/Render sem perder controle
- Preview por PR mantém ciclo de feedback curto
- Aprendizado real de ops útil para o perfil SRE do usuário

### Negativas
- VPS única é SPOF (single point of failure); aceita-se enquanto V1/V2; HA fica para depois
- Coolify é responsabilidade adicional: precisa atualizar, ocasionalmente debugar
- Backup precisa de teste de restore periódico (regra: backup não testado não é backup)
- Sem escalabilidade horizontal automática; gargalo de CPU/RAM exige scale-up manual
- **Coolify usa SSH como `root` para se conectar ao host e executar comandos Docker.** Isso cria um conflito direto com o hardening base (`PermitRootLogin no`, `AllowUsers <user>`): o próprio orquestrador será bloqueado pelo sshd e, em seguida, banido pelo fail2ban. A resolução exige (a) bloco `Match Address 172.16.0.0/12` com `PermitRootLogin prohibit-password` no sshd_config, (b) chave pública do Coolify em `/root/.ssh/authorized_keys`, e (c) `ignoreip = 172.16.0.0/12` no fail2ban. Esses três itens devem ser feitos **durante o hardening**, antes da primeira validação no UI do Coolify (o procedimento detalhado de hardening vive no git history).

## Operação

- **Hardening inicial:** SSH só por chave, root SSH desabilitado, `ufw` permitindo só 22/80/443, `fail2ban`, `unattended-upgrades` configurado.
- **Backups:** `pg_dump` diário (configurado no Coolify) → R2, com teste de restore periódico (regra: backup não testado não é backup).
- **Monitoramento:** Sentry (errors), Logfire (logs/traces), Uptime Kuma no próprio Coolify (uptime), PostHog (produto).
- **Snapshots da VPS:** habilitados na Hostinger (custa pouco; é o lifeline para "rm -rf acidental").

## Invariante de deploy — comunicação interna app→app no Coolify

No Coolify, **bancos** recebem `container_name = <uuid>` e são resolvíveis pelo DNS embutido do Docker; **apps do tipo Docker Image não** — o container ganha sufixo aleatório e o UUID só vira host resolvível na rede compartilhada `coolify` quando o campo **Network Aliases** (em *General → Network*) é preenchido com o próprio UUID. Invariante: **ao criar/wire um app interno (sem `fqdn`, chamado por outro app via UUID), setar `Network Aliases = <uuid>` antes do wire-up.** Sem isso o chamador queima ~5s num DNS morto (timeout do resolver musl no Alpine) e o erro fica mascarado por fallbacks silenciosos — um outage que se disfarça de "engajamento real = 0". Aplicado em `ethitorial-api` (`Network Aliases = y1iaroyitv1k9f46t4dssowt`).

## Comparativo de orquestradores

Critérios: time-to-first-deploy (TTFD), manutenção mensal, DX (preview deploys, web UI, logs), aprendizado, lock-in, overhead de RAM, maturidade.

| Opção | TTFD | Manutenção | DX | Aprendizado | Lock-in | Overhead | Maturidade |
|---|---|---|---|---|---|---|---|
| **Coolify (escolhido)** | ~2h | Baixa | Alta (Vercel-like) | Média | Baixo | ~500MB RAM | Alta (~30k★, ativo) |
| Dokploy | ~2h | Baixa | Alta | Média | Baixo | ~400MB RAM | Média (newer) |
| CapRover | ~1h | Baixa | Média (UX datada) | Baixa | Baixo | ~300MB RAM | Alta (estável) |
| Dokku | ~1h | Baixíssima | Baixa (CLI-only) | Baixa | Muito baixo | ~100MB RAM | Muito alta |
| docker-compose + Caddy | ~1 dia | Média-Alta | Baixíssima | Alta na 1ª vez | Zero | ~50MB RAM | N/A |
| K3s | ~3 dias | Alta | Média (k9s) | Muito Alta | Médio (k8s) | ~1GB+ RAM | Alta |
| Portainer + manual | ~4h | Média | Média (só containers) | Média | Baixo | ~200MB RAM | Alta |

### Por que cada alternativa foi rejeitada

- **Vercel + Fly.io + Neon (serverless):** descartado pela decisão do usuário de usar VPS.
- **docker-compose + Caddy direto:** funcional, lock-in zero, RAM mínima — **opção de fallback explícita** se Coolify falhar no critério de revisão (ver seção Operação). Rejeitado para o início porque exige reinventar preview environments, backups, dashboards, rollback automático.
- **Dokploy:** alternativa válida e mais moderna; reconsiderar em 12-24 meses quando maturidade equiparar.
- **CapRover:** estável mas UX feels 2018; perde em ergonomia.
- **Dokku:** Heroku-like CLI puro; sem web UI nem preview deploys automáticos.
- **K3s:** over-engineering para VPS única e produto solo.
- **Portainer + manual:** ótima UI de containers mas não é PaaS completo; ainda precisa scriptar CI/CD, SSL, backups.

## Gatilho de revisão (regra de Chesterton invertida)

Se você consumir **mais de 2h/mês mantendo Coolify** (atualizações que quebram, debug de container que não sobe, problemas que exigem bypass), reabrir esta decisão. Provável próxima escolha: `docker-compose + Caddy` puro — o tempo gasto provaria que a abstração custa mais do que entrega.

## Histórico

- **2026-05-24:** corrigido o reverse proxy embutido de Caddy → Traefik. A doc oficial Coolify ([proxy/caddy/overview](https://coolify.io/docs/knowledge-base/proxy/caddy/overview), [server/proxies](https://coolify.io/docs/knowledge-base/server/proxies)) confirma que Traefik é o default e Caddy é experimental, com recomendação explícita de manter Traefik para a maioria dos setups. A decisão original (delegar TLS + roteamento ao Coolify) permanece válida; só o nome do proxy embutido mudou.
