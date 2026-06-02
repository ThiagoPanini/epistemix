---
data: 2026-06-01
operacao: publicar epistemix.dev em produção — deploy hello-world + fechar a origem (guide 0003, Passos 4–5)
maquina: panini-vps (Hostinger KVM 2, Ubuntu 24.04 LTS) — VM id 1700377
operador: Thiago Panini
agente: Claude Code
resultado: success
dividas:
  - renovação do cert Let's Encrypt (~30/Ago/2026): porta 80 agora só aceita Cloudflare; a renovação HTTP-01 depende do challenge passar via Cloudflare proxied. Verificar/automatizar antes e anotar no runbook.
  - firewall pré-existente `303222` (panini-vps-firewall, inativo) na conta Hostinger — origem desconhecida, revisar e possivelmente deletar.
  - `.local/hostinger-firewall.py` cria um firewall NOVO a cada run (gerou o órfão `303231`, já deletado). Ajustar para reusar por nome se for virar utilitário recorrente.
  - UFW (allowlist Cloudflare + timer mensal de re-sync) ficou redundante sob o firewall Hostinger; mantido como defesa-em-profundidade. Decidir se simplifica.
  - anotar `CLOUDFLARE_ACCOUNT_ID` + zone IDs (`epistemix.dev`, `thiagopanini.dev`) no `.local/panini-vps-bootstrap.md`.
  - token da API Hostinger (`.env`, gitignored) — revogar após o bootstrap; foi usado só para criar as regras de firewall.
referencias:
  guide: ../guides/0003-publicar-epistemix-dev-em-producao.md
  adr: ../adr/0016-vps-agnostica-multi-projeto.md
  setup_anterior: 0003-generalizar-vps-panini.md
  runbook: ../runbooks/0001-operacao-vps.md
---

# 20260601 — Publicar epistemix.dev: deploy hello-world + fechar a origem

Registro narrativo da sessão que executou os **Passos 4 e 5** do [guide 0003](../guides/0003-publicar-epistemix-dev-em-producao.md): publicar uma aplicação placeholder (`nginxdemos/hello`) em `https://epistemix.dev` atrás da Cloudflare com TLS `Full (strict)`, e **fechar a origem** da VPS provando por validação externa tripla. Continuação direta da [generalização da VPS](0003-generalizar-vps-panini.md). A borda Cloudflare parcial (NS migrados, painel Coolify proxied, admin) já vinha de sessão anterior (commit `chore(roadmap): marcar borda Cloudflare concluída`).

## Cenário

- Estado herdado verde: NS de `epistemix.dev` e `thiagopanini.dev` na Cloudflare; painel Coolify em `https://vps.thiagopanini.dev` (proxied, Full strict); admin do Coolify criado; portfólio Vercel intacto em `thiagopanini.dev`.
- Faltava: registros DNS do produto (`@`/`www`), recurso publicado no Coolify, proxy laranja + Full strict no `epistemix.dev`, e o fechamento da origem.
- `<SEU_IP_VPS>` = IP público da VPS (mantido em `.local/`, fora do repo público). SSH via alias `panini-vps` (chave `panini_vps_ed25519`).

## Execução (resumo do que ficou de pé)

- **Passo 4a/b/c:** `A @ → <SEU_IP_VPS>` + `CNAME www → epistemix.dev` (cinza→laranja); recurso Docker Image `nginxdemos/hello:latest` (porta 80) no Project `epistemix`/`production`; Domains `https://epistemix.dev,https://www.epistemix.dev`; Cloudflare `Full (strict)` + Edge (Always HTTPS, min TLS 1.2, Auto HTTPS Rewrites) nas duas zonas. Cert LE emitido para apex+www (válido ~30/Ago).
- **Passo 5:** origem fechada via **firewall Hostinger** (não UFW — ver obstáculos), liberando só `22` (any) e `80/443` dos ranges Cloudflare; default deny-all fecha `8000/6001/6002/8080`. Validação tripla passou.

**Prova final (origem fechada):**

```text
# A — meu WSL (egress residencial, não-Cloudflare):
:80 / :443 / :8000 direto → Connection timed out ; via Cloudflare → HTTP/2 200
# B — --resolve contrastando origem vs edge:
--resolve epistemix.dev:443:<SEU_IP_VPS>  → timeout
--resolve epistemix.dev:443:104.21.21.20  → 200
# C — check-host.net (KZ/NL/SG/US/ES/IN/LT): :80 e :8000 fechados em todos os nós
```

## Obstáculos e resoluções (as surpresas)

- **Registro A do produto criado na ZONA ERRADA.** No 4a, o `A @ → <SEU_IP_VPS>` entrou em `thiagopanini.dev` em vez de `epistemix.dev` (o dashboard estava na zona de infra; a prévia "www.**thiagopanini.dev** is an alias of…" denunciou). Resultado: o apex do portfólio passou a fazer round-robin entre os 2 IPs Vercel **e** o IP da VPS — `dig` mostrou 3 IPs, ~1/3 dos acessos batendo na origem (404 do Traefik). **Correção:** deletar só a linha `<SEU_IP_VPS>` (preservando as Vercel) e recriar os dois registros na zona `epistemix.dev`. Lição: sempre confirmar a zona ativa pela prévia do FQDN antes de salvar.

- **Tag de imagem inválida `nginxdemos/hello:demo`.** O Coolify gravou a tag como `demo` (não existe no Docker Hub) → deploy `failed` com `failed to resolve reference … :demo: not found`. Diagnóstico veio do log de deploy no Postgres do Coolify (`application_deployment_queues`), não da UI. **Correção:** tag `latest` (tags válidas: `latest`, `plain-text`, `0.1`–`0.4`). Também faltava o campo Domains (estava no `…sslip.io` padrão).

- **Chrome não acessava `https://epistemix.dev`** mesmo com tudo certo no autoritativo. Causa: **NordVPN** forçando DNS pelos resolvers dele (`103.86.96.100/99.100`) com **cache negativo** do domínio (a zona estava vazia minutos antes). `Resolve-DnsName` no Windows voltava vazio enquanto `dig @1.1.1.1` já resolvia. **Correção:** `ipconfig /flushdns` + aguardar; futuro = DNS custom `1.1.1.1` na VPN. (Apêndice B do guide 0003.)

- **Docker fura o UFW — o UFW sozinho NÃO fecha a origem.** Após aplicar a Fase 1 (allowlist Cloudflare em 80/443 + remover `Anywhere` + timer mensal), a validação tripla mostrou `:80 404`, `:443 200`, `:8000 302` ainda abertos do exterior. O `docker-proxy` publica as portas via cadeia `DOCKER` do iptables, que corre antes do filtro do host. Avaliei `ufw-docker` (instala bloco `DOCKER-USER` no `after.rules`) mas **revertei**: deixaria uma mina (o timer mensal roda `ufw reload` e ativaria o bloco sem as regras `ufw route allow`, quebrando o site em ~1 mês). Restaurei `after.rules`/`after6.rules` dos backups e removi o binário. **Decisão:** firewall **Hostinger** (upstream, default deny-all), onde o Docker não fura.

- **API Hostinger baniu o User-Agent do Python (erro Cloudflare 1010).** `developers.hostinger.com` fica atrás do Cloudflare com bot-protection; o `User-Agent: Python-urllib/3.x` é `browser_signature_banned`. Mesma rota com UA de browser → `401 Unauthenticated` (correto). **Correção:** `User-Agent` de browser no script.

- **`sourceDetail` é valor único — 44 regras.** O modelo da API (`VPSV1FirewallFirewallRuleResource`) define `sourceDetail` como string única ("IP range, CIDR, single IP or `any`") — não aceita bloco de CIDRs. Pela UI seriam 44 regras manuais. **Solução:** script Python (`.local/hostinger-firewall.py`) via API criando SSH(22) + 80/443 × 22 CIDRs Cloudflare num run só (self-test na 1ª regra, gate `APPLY=1` para ativar), token lido do `.env` (gitignored) no terminal do operador.

- **Propagação do firewall Hostinger ~1 min.** O primeiro `curl` logo após `activate` ainda mostrou portas abertas (estado pré-propagação) — quase me levou a concluir falha. `nc`/re-`curl` ~1 min depois confirmaram tudo fechado. Lição: dar ~60–90s ao firewall Hostinger antes de validar.

## Dívidas

Ver frontmatter. Destaques: **renovação do cert LE** (porta 80 agora CF-only — validar o ACME pass-through antes de ~30/Ago e anotar no runbook); firewall `303222` órfão a revisar; revogar o token da API Hostinger; anotar zone IDs no `.local/`.
