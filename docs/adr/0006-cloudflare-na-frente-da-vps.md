# ADR 0006 — Cloudflare como camada de borda na frente da VPS

- **Status:** Accepted
- **Data:** 2026-05-23
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0003](0003-infra-hostinger-vps-coolify.md)

## Contexto

O ADR-0003 hospeda a aplicação em VPS Hostinger única. VPS pública sem camada de borda apresenta riscos arquiteturais reais:

- **IP exposto:** atacantes podem alvejar a origem diretamente; um DDoS modesto derruba a VPS.
- **Egress não cacheado:** cada visitante baixa assets (JS, CSS, imagens) direto da VPS — consumindo bandwidth e CPU desnecessariamente, com risco de estourar limites da Hostinger.
- **Sem WAF:** ataques HTTP comuns (SQLi attempts, scanners) chegam até a aplicação para serem filtrados.
- **TLS na VPS:** configuração e renovação de certificados é responsabilidade local (Caddy resolve, mas é responsabilidade adicional).

## Decisão

**Posicionar Cloudflare entre usuário e VPS** com 4 responsabilidades:

### 1. DNS autoritativo

Zona `talkingpres.com` (e variantes adquiridas) hospedada na Cloudflare. Substitui DNS da Hostinger. Propagação rápida, suporte completo a A/CNAME/SRV/TXT/CAA/HTTPS records.

### 2. Proxy reverso ("orange cloud" ligado)

Requisições não vão direto à origem. Caminho:

```
usuário → POP Cloudflare (geograficamente próximo)
       → conexão otimizada Cloudflare ↔ origem
       → VPS Hostinger (Caddy do Coolify)
       → app
```

**Modo TLS:** `Full (Strict)`. TLS terminado na borda E mantido entre Cloudflare e origem com cert válido (não self-signed). Caddy do Coolify continua emitindo certs Let's Encrypt para origem.

**Origem escondida:** IP da VPS nunca aparece em DNS público. Mitigação:
- Firewall da VPS aceita 80/443 **somente de IP ranges da Cloudflare** (lista publicada em [cloudflare.com/ips](https://www.cloudflare.com/ips/))
- Ou usa `cloudflared tunnel` (Cloudflare Tunnel) para conexão saindo da VPS — sem porta aberta na origem

### 3. CDN (cache de assets)

Cloudflare cacheia respostas marcadas como cacheáveis em todos os POPs.

- Assets estáticos do Next.js (JS, CSS, fontes, imagens) cacheados automaticamente
- HTML dinâmico **não cacheado** por padrão (Page Rules / Cache Rules customizam quando útil)
- Reduz egress da origem drasticamente, reduz CPU servindo arquivos estáticos

### 4. WAF + DDoS protection (free tier)

- Padrões clássicos de ataque (SQLi, XSS em path, scanners conhecidos) bloqueados na borda
- DDoS L3/L4 (volumétrico) absorvido sem afetar origem
- DDoS L7 com proteção básica no free tier

### Cloudflare R2 (storage de assets de usuário)

R2 (S3-compatible, zero egress fee) usado para:

- Assets de usuário (futuras imagens de apresentação, exports)
- Backups Postgres do Coolify

Decisão relacionada, não revertida aqui — registrada para visibilidade.

## Justificativa

**Por que Cloudflare e não alternativa:**

| Opção | Por quê não |
|---|---|
| Sem CDN/proxy | Origem exposta, egress estoura, ataque modesto derruba prod |
| AWS CloudFront | Complexidade desproporcional, billing por uso (surpresas), sem WAF free |
| Fastly | Foco enterprise, paid from day 1 |
| Bunny.net | Excelente CDN, mas sem WAF e proteção DDoS robusta |
| Caddy direto sem CDN | TLS resolvido, mas perde cache e proteção; egress 100% origem |

**Por que vale apesar de "mais uma dependência":**

- Free tier cobre V1 e V2 confortavelmente
- DNS, proxy, CDN, WAF integrados em um painel
- Reverter é trivial (apontar DNS para outro provedor) — lock-in baixo
- Comunidade enorme, troubleshooting documentado

## Consequências

### Positivas
- Origem protegida (IP escondido + WAF + DDoS)
- Egress da origem reduzido drasticamente
- TLS robusto sem esforço operacional adicional
- Performance global via POPs próximos
- R2 integrado para storage sem egress fee

### Negativas
- **Mais uma dependência para debugar.** Bugs de "cache servindo conteúdo velho" passam a existir. Mitigação: documentar `cf-cache-status` headers no playbook, usar `Cache-Control` explícito em respostas dinâmicas.
- **Geolocalização do request vista pela origem é IP da Cloudflare**, não do usuário. Mitigação: ler `CF-Connecting-IP` header em vez de `X-Forwarded-For` direto.
- **Page Rules / Cache Rules são poder de fogo:** configurações erradas podem cachear coisa indevida (ex.: respostas de usuário logado). Convenção: nunca cachear path com `set-cookie` na resposta.
- **Cloudflare como SPOF de borda.** Outage da Cloudflare = site fora. Aceitável (raro, e a Cloudflare comunica bem).

## Implicações operacionais

- **Headers a respeitar na aplicação:** `CF-Connecting-IP` (IP real do usuário), `CF-IPCountry` (país), `CF-Ray` (request ID útil para suporte).
- **Cache invalidation:** API/UI da Cloudflare para purge por URL ou tag. Documentar quando usar em deploys.
- **Health check entre Cloudflare e origem:** Cloudflare Load Balancing tem health check próprio (paid). Free tier: monitorar via Uptime Kuma na própria VPS apontando para o domínio público.

## Quando reconsiderar

- Tráfego cresce ao ponto de Pro ($25/mês) virar gargalo de regras WAF custom
- Necessidade de compliance específica (HIPAA, PCI) que Cloudflare free não cobre
- Decisão de mudar de single-VPS para multi-region com balanceamento próprio
- Cloudflare introduzir mudanças de preço ou política inaceitáveis (improvável, mas o ADR existe para tornar a reversão consciente)

## Opções rejeitadas

- **Não usar CDN/proxy:** custo de egress + risco de DDoS inaceitáveis para SaaS público.
- **AWS CloudFront + WAF + Route53:** funcionalmente equivalente, complexidade muito maior, billing por uso imprevisível.
- **Fastly:** excelente, mas paid from day 1 sem ganho proporcional no contexto.
- **Bunny.net puro:** CDN forte, mas sem WAF/DDoS layer robusta.
- **Cloudflare Tunnel em vez de proxy convencional:** opção válida (origem sem porta aberta), reabrir se hardening do firewall ficar incômodo.
