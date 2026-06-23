---
title: Publicar epistemix.dev em produção (Cloudflare + Coolify)
description: Tutorial completo e linear para colocar o epistemix.dev no ar na VPS panini-vps — duas zonas na Cloudflare (epistemix.dev produto + thiagopanini.dev infra), painel Coolify em vps.thiagopanini.dev, deploy de um app hello-world com TLS válido e fechamento da origem. Concreto, com gates de verificação em cada passo.
nav_title: Publicar epistemix.dev
---

> **Nota-ponte (2026-06-22):** o produto foi rebatizado para **ethitorial** e migrou para `ethitorial.panlabs.tech`; este registro preserva o nome e o domínio `epistemix.dev` da época — ver [ADR-0021](../adr/0021-rebatismo-ethitorial-e-migracao-panlabs-tech.md).

Este guide leva o `epistemix.dev` (domínio do produto, já adquirido) do zero ao ar na VPS `panini-vps`, atrás da Cloudflare, com TLS válido e origem fechada — e já organiza a infra "do jeito certo desde o início": o **painel do Coolify** fica numa zona de infra (`vps.thiagopanini.dev`), separada da zona do produto. É a continuação concreta do [guide 0001](0001-criar-vps-hostinger-com-coolify.md) (VPS + Coolify) e do [guide 0002](0002-configurar-cloudflare-r2-mcp.md) (mecânica genérica de Cloudflare e fechamento de origem); aqui os valores são reais e há um passo que o 0002 não cobre: **publicar uma aplicação num domínio**.

A VPS é **agnóstica e multi-projeto** ([ADR-0016](../adr/0016-vps-agnostica-multi-projeto.md)). Modelo de zonas adotado:

| Zona Cloudflare | Papel | O que aponta para a VPS |
|---|---|---|
| `epistemix.dev` | **produto** (o hub) | `@`, `www` → app no Coolify |
| `thiagopanini.dev` | **infra + portfólio** | `vps` → painel Coolify *(apex/www continuam na Vercel)* |

Cada projeto futuro adiciona só a sua zona de produto e repete os passos de deploy.

> ⚠️ **Bootstrap, não runbook.** Mexe em DNS autoritativo (inclusive de um site vivo — o portfólio na Vercel), TLS e firewall. Faça numa janela calma e pare se qualquer *proof* falhar. Para operação cotidiana, use o [runbook 0001](../runbooks/0001-operacao-vps.md).

> 🔑 **Pré-condição de acesso:** a chave `~/.ssh/panini_vps_ed25519` carregada no agent (`ssh-add`). Os passos on-box assumem `ssh panini-vps` (alias em `~/.ssh/config`). O `<SEU_IP_VPS>` real vive só no caderno `.local/panini-vps-bootstrap.md` (gitignored) — **não** está neste guide de propósito.

## A pegadinha que organiza tudo: Let's Encrypt × Cloudflare proxy

Se você ligar a **nuvem laranja (proxied)** *antes* de o Coolify emitir o certificado Let's Encrypt, o challenge HTTP-01 do LE não chega ao Traefik na origem e você toma **erro 526 (Invalid SSL Certificate)**. A Cloudflare termina o TLS na borda e o cert da origem nunca fica pronto.

**Padrão LE-seguro (cinza → laranja)** — usado em todo registro que aponta para a VPS:

```text
1. Cria o registro como  DNS Only (nuvem CINZA) ── a origem fica exposta, mas o LE valida pela porta 80
2. Coolify/Traefik emite o cert Let's Encrypt    ── proof: https://<host> abre com cert válido direto na origem
3. Liga o proxy           (nuvem LARANJA)         ── Cloudflare passa a fronteia; IP da origem some do DNS público
4. SSL/TLS → Full (strict)                        ── cert válido na origem ⇒ sem 526
```

> O challenge HTTP-01 roda sobre HTTP na porta 80 e **ignora HSTS** — por isso funciona mesmo o `.dev` sendo HSTS-preload ([pegadinhas](#apêndice-b--pegadinhas-confirmadas)). A janela "cinza" expõe o IP de origem por minutos; é o mesmo trade-off da criação do admin no guide 0002. Fechamos a origem no Passo 5.
>
> ⚠️ **Registros do portfólio Vercel (Passo 2) são exceção:** ficam **sempre cinza** e nunca passam pela VPS — a Vercel faz o próprio TLS. O padrão acima vale só para os hosts que apontam para a VPS (`vps.thiagopanini.dev`, `epistemix.dev`, `www`).
>
> ⚠️ **Segunda armadilha — importação automática da Cloudflare:** ao adicionar uma zona existente, a Cloudflare importa todos os records (incluindo wildcards) e frequentemente os marca como Proxied. Isso bloqueia o padrão cinza→laranja descrito acima — wildcards Proxied sobrepõem registros específicos que você criar. Veja o Passo 2b para a lista de limpeza obrigatória pós-importação.

## Example

Ao final: `https://epistemix.dev` e `https://www.epistemix.dev` servindo um hello-world com TLS válido via Cloudflare `Full (strict)`; painel Coolify em `https://vps.thiagopanini.dev`; portfólio `https://thiagopanini.dev` continuando no ar pela Vercel; origem da VPS fechada e provada por validação externa tripla.

**Pré-condições:**

- Ambiente local POSIX com `ssh`, `dig`, `curl` (WSL2/Git Bash no Windows).
- [Guide 0001](0001-criar-vps-hostinger-com-coolify.md) concluído: Coolify rodando, portas temporárias `8000/6001/6002` abertas, porta `80` aberta ao mundo (necessária para o LE).
- Conta Cloudflare (free) com payment method confirmado.
- Acesso ao registrar do `epistemix.dev` e ao painel da **Vercel** (registrar + DNS atual do `thiagopanini.dev`).
- Bitwarden pronto para `panini-vps/coolify-admin`.
- Caderno `.local/panini-vps-bootstrap.md` aberto (tem o `<SEU_IP_VPS>` e os IDs Cloudflare).

**Valores concretos deste guide:**

| Placeholder | Valor |
|---|---|
| `<DOMINIO_PRODUTO>` | `epistemix.dev` |
| `<DOMINIO_INFRA>` | `thiagopanini.dev` |
| `<SUBDOMINIO_COOLIFY>` | `vps.thiagopanini.dev` |
| `<SEU_IP_VPS>` | valor real só em `.local/panini-vps-bootstrap.md` (gitignored, não versionar) |
| `<NOME_VPS>` | `panini-vps` |
| `<USUARIO_DEPLOY>` | `deploy` |
| `<PORTA_COOLIFY_DIRETA>` | `8000` |

---

## Passo 0: Descobrir os registrars

A troca de nameservers acontece no registrar de cada domínio.

```bash
whois epistemix.dev    | grep -iE 'registrar:|name server'
whois thiagopanini.dev | grep -iE 'registrar:|name server'
```

- `thiagopanini.dev` foi comprado na **Vercel** → a troca de NS e os records atuais estão em **Vercel → Settings → Domains**.
- `epistemix.dev`: se for **Cloudflare Registrar**, a zona já nasce na conta (pula a troca de NS); se for Vercel/outro, troca no painel correspondente.

> 💡 Por que duas zonas e não um subdomínio? No plano **Free**, a Cloudflare **não** delega subdomínio isolado (`vps.thiagopanini.dev` como zona à parte) — isso é Enterprise. Para o painel ficar atrás da Cloudflare, move-se a **zona inteira** do `thiagopanini.dev` (Passo 2). Quem não quiser mexer no portfólio agora pode usar o painel interino em `epistemix.dev` ([Apêndice A](#apêndice-a--alternativa-painel-interino-em-epistemixdev)).

---

## Passo 1: Ativar a zona epistemix.dev na Cloudflare (produto)

1. Cloudflare Dashboard → **Add a site** → `epistemix.dev` → plano **Free** → **full setup**.
2. Domínio novo, sem email/serviços: provavelmente nada a preservar — confira mesmo assim.
3. Anote os **2 nameservers** da Cloudflare.
4. No registrar do `epistemix.dev`, substitua os nameservers pelos da Cloudflare. Se houver **DNSSEC/DS** ativo, desative antes.

**Proof:**

```bash
dig ns epistemix.dev @1.1.1.1 +short      # esperado: os 2 NS da Cloudflare
```

A zona pode levar de minutos a 24h para virar **Active**. Anote no `.local/`:

```text
CLOUDFLARE_ACCOUNT_ID=...
EPISTEMIX_ZONE_ID=...
```

> Troubleshooting de zona presa em `Pending`: [guide 0002 → Passo 1](0002-configurar-cloudflare-r2-mcp.md).

---

## Passo 2: Mover a zona thiagopanini.dev para a Cloudflare (infra, sem derrubar o portfólio)

Aqui mexemos num **site vivo**. A regra de ouro: **recriar na Cloudflare os registros que apontam o portfólio para a Vercel ANTES de trocar os nameservers**, todos em **DNS Only (cinza)**.

### 2a. Capturar os records atuais da Vercel

Em **Vercel → Project do portfólio → Settings → Domains**, anote exatamente os records que a Vercel pede (não chute). Tipicamente:

- apex `@` → `A 76.76.21.21`
- `www` → `CNAME cname.vercel-dns.com` (ou um `*.vercel-dns.com` específico do projeto)

Capture também quaisquer `TXT` de verificação (Vercel, Google, etc.).

### 2b. Adicionar a zona na Cloudflare e limpar os records importados

1. Cloudflare → **Add a site** → `thiagopanini.dev` → **Free** → **full setup**. A Cloudflare tenta **importar** os records da zona atual automaticamente — isso parece conveniente, mas **é uma armadilha**.

> ⚠️ **Cilada da importação automática — leitura obrigatória antes de avançar**
>
> A Cloudflare importa os records do DNS atual, mas com dois problemas frequentes que precisam ser corrigidos manualmente:
>
> **Problema 1 — Wildcards importados como Proxied:** se a zona anterior tiver um registro curinga `*.thiagopanini.dev` (comum em configurações Vercel), ele é importado com proxy laranja. **Wildcards proxied tem prioridade sobre registros específicos** — qualquer subdomain novo que você criar (como `vps`) vai resolver para os IPs do wildcard em vez do IP que você definiu. Você criará o `vps` record correto, mas ele nunca propagará enquanto o wildcard estiver lá.
>
> **Problema 2 — Apex/www e outros registros importados como Proxied:** hosts servidos pela Vercel precisam ficar cinza. A Cloudflare importa sem saber que eles são da Vercel.
>
> **Ação obrigatória:** após o onboarding, antes de trocar os nameservers, audite e corrija **todos** os records importados conforme a tabela abaixo.

2. **Audite e corrija os records importados** — abra a aba DNS da zona e execute esta lista:

| Ação | O que procurar | Correção |
|---|---|---|
| **Deletar** | Qualquer record `*.thiagopanini.dev` (wildcard) | Delete todos — não são necessários |
| **Cinza** | `thiagopanini.dev` A records (apex) | Mude para **DNS only** |
| **Cinza** | `www.thiagopanini.dev` records | Mude para **DNS only** |
| **Cinza** | `_domainconnect` CNAME | Mude para **DNS only** |
| **Verificar** | Records `CAA` | Se existir CAA, garanta que inclua `0 issue "letsencrypt.org"` — sem isso, o Let's Encrypt não consegue emitir cert |

3. Garanta que os records do portfólio batem com o Passo 2a, **todos cinza (DNS Only)**:

| Type | Name | Conteúdo | Proxy |
|---|---|---|---|
| A | `@` | `216.198.79.1` e `64.29.17.1` *(IPs Vercel reais da sua conta)* | **DNS only (cinza)** |
| A | `www` | `216.198.79.65` e `64.29.17.65` *(IPs Vercel reais da sua conta)* | **DNS only (cinza)** |
| TXT | … | *(verificações que existirem)* | n/a |
| CAA | `@` | `0 issue "letsencrypt.org"` *(se não existir, crie)* | n/a |

> ⚠️ **Nunca proxie (laranja) um host servido pela Vercel.** Vercel faz TLS/CDN próprios; proxiar dá conflito de cert e loop. Portfólio = sempre cinza.
>
> 💡 **Os IPs Vercel reais podem variar.** Os valores acima (`216.198.79.x`, `64.29.17.x`) são os que a Vercel usava em maio/2026 para `thiagopanini.dev`. Sempre confirme no painel Vercel → Domains quais IPs a Vercel pede para o seu domínio.

4. Anote os **2 nameservers** que a Cloudflare deu para `thiagopanini.dev`.

### 2c. Trocar os nameservers na Vercel

Em **Vercel → Domains → `thiagopanini.dev` → Nameservers**, troque para os da Cloudflare (Vercel chama de "usar nameservers de terceiros"). Se houver **DNSSEC** ligado na Vercel, desligue antes.

**Proof — NS migrados e portfólio intacto:**

```bash
dig ns thiagopanini.dev @1.1.1.1 +short        # esperado: NS da Cloudflare
curl -sI https://thiagopanini.dev | head -1    # esperado: 200/308 — portfólio ainda no ar pela Vercel
dig +short thiagopanini.dev                     # esperado: 76.76.21.21 (Vercel), NÃO o IP da VPS
```

Se o portfólio cair, **volte os NS para a Vercel** (rollback) e reveja os records do Passo 2b antes de tentar de novo.

---

## Passo 3: Admin do Coolify + painel em vps.thiagopanini.dev

### Pré-condição: SSH host→container funcionando

Antes de abrir o UI do Coolify, confirme que os três itens abaixo estão no lugar — o Coolify vai tentar SSH para o host imediatamente ao validar o servidor, e cada falha conta como tentativa para o fail2ban:

**a) Chave pública do Coolify em `/root/.ssh/authorized_keys`:**

```bash
# Ler a chave pública do Coolify
ssh panini-vps 'sudo docker exec coolify cat /var/www/html/storage/app/ssh/keys/id.root@host.docker.internal.pub'

# Adicionar ao authorized_keys do root (substitua <CHAVE> pela saída acima)
ssh panini-vps 'echo "<CHAVE>" | sudo tee -a /root/.ssh/authorized_keys'
```

**b) Bloco `Match Address` no sshd para permitir root da rede Docker:**

```bash
ssh panini-vps 'sudo tee -a /etc/ssh/sshd_config.d/00-hardening.conf <<EOF

Match Address 172.16.0.0/12
    PermitRootLogin prohibit-password
EOF
sudo systemctl reload ssh'
```

**c) `ignoreip` da rede Docker no fail2ban:**

```bash
ssh panini-vps "sudo sed -i '/^\[DEFAULT\]/a ignoreip = 127.0.0.1/8 ::1 172.16.0.0/12' /etc/fail2ban/jail.local && sudo systemctl reload fail2ban"
```

**Proof — gate obrigatório antes de continuar:**

```bash
ssh panini-vps 'sudo docker exec -u root coolify sh -c "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i /var/www/html/storage/app/ssh/keys/id.root@host.docker.internal root@host.docker.internal echo ok 2>&1"'
```

Saída esperada: `ok`. Se não retornar `ok`, não prossiga — veja [lição 0001 §"Exceção estrutural: orquestradores containerizados"](../lessons/0001-hardening-de-vps-linux.md).

---

### 3a. Criar o admin (janela curta de exposição)

O `/register` do Coolify fica público enquanto não há admin. Bitwarden aberto **antes**.

1. Abra `http://<SEU_IP_VPS>:8000` → crie o admin (email `panini.development@gmail.com`).
2. Senha forte → salve **direto** em Bitwarden como `panini-vps/coolify-admin` (sem clipboard/scratchpad).

### 3b. Publicar o painel (padrão LE-seguro cinza → laranja)

Na zona `thiagopanini.dev` → **Add record**:

| Type | Name | IPv4 | Proxy |
|---|---|---|---|
| A | `vps` | `<SEU_IP_VPS>` | **DNS only (cinza)** ← por ora |

No Coolify → **Settings → Configuration → Instance Domain** (ou *General → Instance's domain*):

```text
https://vps.thiagopanini.dev
```

Salve. O Coolify reconfigura o Traefik e dispara o Let's Encrypt:

```bash
ssh panini-vps 'sudo docker logs coolify-proxy 2>&1 | grep -i acme | tail -20'
```

**Proof — cert na origem (ainda cinza):**

```bash
# Comando confiável para verificar cert — grep no curl falha silenciosamente em alguns ambientes
echo | openssl s_client -connect <SEU_IP_VPS>:443 -servername vps.thiagopanini.dev 2>/dev/null \
  | openssl x509 -noout -issuer -subject -dates
```

Esperado:
```
issuer=C = US, O = Let's Encrypt, CN = ...
subject=CN = vps.thiagopanini.dev
notBefore=...
notAfter=... (90 dias)
```

> ⚠️ **Evite `curl -vI ... | grep -Ei 'subject|issuer'`** para verificar certs — o grep captura a saída do TLS handshake do curl, que é formatada diferente em cada versão/ambiente e frequentemente retorna vazio mesmo com cert válido. O `openssl s_client` conecta diretamente e é definitivo.
>
> Se o cert ainda não emitiu, monitore os logs do Traefik:
> ```bash
> ssh panini-vps 'sudo docker logs coolify-proxy 2>&1 | grep -i acme | tail -20'
> ```

**Agora** mude o record `vps` para **Proxied (laranja)**.

**Proof — origem escondida:**

```bash
dig +short vps.thiagopanini.dev      # esperado: IPs Cloudflare, NÃO <SEU_IP_VPS>
```

---

## Passo 4: Deploy do hello-world em epistemix.dev

O passo que o guide 0002 não cobre: publicar uma **aplicação** num domínio. Placeholder até o Next.js real (ROADMAP Fase 1).

### 4a. Registros DNS do produto — DNS Only primeiro

Na zona `epistemix.dev`, adicione (ambos **cinza**):

| Type | Name | Conteúdo | Proxy |
|---|---|---|---|
| A | `@` | `<SEU_IP_VPS>` | **DNS only (cinza)** |
| CNAME | `www` | `epistemix.dev` | **DNS only (cinza)** |

### 4b. Criar o recurso no Coolify

1. Coolify → **Projects → + Add** → Project **`epistemix`** (isolamento por projeto, ADR-0016) → Environment `production`.
2. **+ New Resource → Docker Image** (caminho mais simples sem build):
   - **Image:** `nginxdemos/hello` (página "hello" na porta 80). *(Alternativa: `traefik/whoami`.)*
   - **Ports Exposes:** `80`
3. Em **Domains** do recurso (com `https://`, vírgula separa — é o que dispara o TLS):

```text
https://epistemix.dev,https://www.epistemix.dev
```

4. **Deploy.** O Traefik emite o LE (porta 80 alcançável porque está cinza).

**Proof — app no ar com cert válido (ainda cinza):**

```bash
curl -sI https://epistemix.dev | head -1                 # HTTP/2 200
echo | openssl s_client -connect <SEU_IP_VPS>:443 -servername epistemix.dev 2>/dev/null \
  | openssl x509 -noout -issuer -subject -dates          # Let's Encrypt, 90 dias
```

### 4c. Ligar o proxy e fechar o TLS

1. Cloudflare (zona `epistemix.dev`) → mude `@` e `www` para **Proxied (laranja)**.
2. **SSL/TLS → Overview → Full (strict)**.
3. **SSL/TLS → Edge Certificates:** Always Use HTTPS = **On**, Minimum TLS = **1.2**, Automatic HTTPS Rewrites = **On**.

Repita o `Full (strict)` + Edge na zona `thiagopanini.dev` (vale para o subdomínio `vps`; o portfólio cinza não é afetado pelo modo SSL, pois não passa pela origem da Cloudflare).

**Proof final do produto:**

```bash
dig +short epistemix.dev                            # IPs Cloudflare (origem escondida)
curl -sI https://epistemix.dev | grep -i 'cf-ray'   # header da Cloudflare presente
```

> **Tomou 526?** O proxy foi ligado antes de o cert da origem estar válido. Volte o record para cinza, confirme `curl -vI https://<host>` direto na origem, e só então religue laranja. Mecânica TLS de três lados: [guide 0002 → Passo 2a](0002-configurar-cloudflare-r2-mcp.md).

---

## Passo 5: Fechar a origem

Só agora — painel e produto servindo via Cloudflare — feche a origem. A mecânica completa (script `ufw-cloudflare-sync.sh`, timer mensal, armadilha Docker×UFW) está no **[guide 0002 → Passo 2b](0002-configurar-cloudflare-r2-mcp.md)**. Resumo:

1. Permitir `80/443` **só dos ranges Cloudflare** (script do guide 0002).
2. Remover os `ALLOW Anywhere` de `80/443` e as portas temporárias `8000/6001/6002`.
3. Manter `22` (SSH).

> 🤖 **Posso aplicar este passo ao vivo** com a chave carregada — mais seguro que colar. Me chame quando os Passos 1–4 estiverem verdes.

> ⚠️ **Sequência importa:** só feche `8000` depois que `https://vps.thiagopanini.dev` estiver funcionando — senão você perde o painel. Nunca rode `ufw` sem manter uma sessão SSH aberta ([runbook 0001](../runbooks/0001-operacao-vps.md)).

### Validação externa tripla (obrigatória)

Origem fechada exige falhar em **três** vantage points (detalhe no guide 0002). Substitua `<SEU_IP_VPS>` pelo valor do caderno `.local/`:

```bash
# A — direto (deve expirar):
curl -I --max-time 5 http://<SEU_IP_VPS>
# B — bypass de DNS (1ª FALHA, 2ª PASSA):
curl -I --max-time 5 --resolve epistemix.dev:443:<SEU_IP_VPS> https://epistemix.dev
curl -I --max-time 5 https://epistemix.dev
# C — vantage externo: check-host.net/check-tcp em <SEU_IP_VPS>:80 e :8000 → timeout em todos
```

---

## Passo 6: Critério de sucesso

Concluído quando **todos** passam:

- [ ] `dig ns epistemix.dev @1.1.1.1` e `dig ns thiagopanini.dev @1.1.1.1` → nameservers Cloudflare; ambas zonas **Active**.
- [ ] `https://thiagopanini.dev` (portfólio) **continua no ar** pela Vercel; `dig +short thiagopanini.dev` → IP Vercel (`76.76.21.21`), não o da VPS.
- [ ] `dig +short epistemix.dev` e `dig +short vps.thiagopanini.dev` → IPs Cloudflare (não `<SEU_IP_VPS>`).
- [ ] `https://epistemix.dev` e `https://www.epistemix.dev` → `200`, cert válido, SSL **Full (strict)**.
- [ ] `https://vps.thiagopanini.dev` → painel Coolify com TLS válido; admin salvo em `panini-vps/coolify-admin`.
- [ ] Project `epistemix` no Coolify com o recurso publicado.
- [ ] Origem fechada provada pela validação tripla.
- [ ] `CLOUDFLARE_ACCOUNT_ID` + zone IDs anotados em `.local/panini-vps-bootstrap.md`.

Registre a sessão real num **ai-ops** (`docs/ai-ops/000N-publicar-epistemix-dev.md`) com surpresas e dívidas — trilha auditável do projeto.

---

## Next steps

- Trocar o hello-world pelo **skeleton Next.js do epistemix** (ROADMAP Fase 0) no mesmo Project/domínio.
- **Backup Postgres em R2** (guide futuro): bucket `panini-vps-backups`, credencial S3 escopada, restore mensal.

---

## Apêndice A — Alternativa: painel interino em epistemix.dev

Se preferir **não** mexer no `thiagopanini.dev` agora, pule o Passo 2 e publique o painel em `painel.epistemix.dev`:

1. Na zona `epistemix.dev`, crie `A painel → <SEU_IP_VPS>` (padrão cinza → laranja).
2. Coolify → Instance Domain = `https://painel.epistemix.dev`.
3. Mais tarde, faça o Passo 2 e migre o Instance Domain para `vps.thiagopanini.dev`, removendo o record `painel`.

Custo: o painel fica acoplado à zona do produto (menos organizado). É o caminho mais rápido e de risco zero ao portfólio.

> A forma mais "pura" (zona de infra dedicada, sem ser produto nenhum) seria um domínio só-de-infra. Para setup solo, `vps.thiagopanini.dev` é um meio-termo suficiente — namespace pessoal, lê como "minha VPS".

---

## Apêndice B — Pegadinhas confirmadas

- **526 (Invalid SSL Certificate):** proxy ligado antes do cert da origem. Use cinza→laranja. ([Coolify #6271](https://github.com/coollabsio/coolify/issues/6271), [Cloudflare 526](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-526/))

- **Wildcard importado como Proxied bloqueia novos subdomínios:** quando você adiciona uma zona com wildcard existente (`*.thiagopanini.dev`), a Cloudflare importa o wildcard com proxy laranja. Qualquer novo registro `A` específico que você crie (ex.: `vps`) fica obscurecido — o wildcard tem precedência e resolve para os IPs do wildcard em vez do IP que você definiu. **Diagnóstico:** `dig +short vps.thiagopanini.dev @1.1.1.1` retorna IPs inesperados (ex.: Vercel) em vez do IP da VPS. **Correção:** delete todos os records wildcard (`*.thiagopanini.dev`).

- **Proxiar a Vercel quebra:** host servido pela Vercel (apex/www do portfólio) deve ficar **cinza**; laranja gera conflito de cert. A Cloudflare importa esses records sem saber que são da Vercel — verifique o proxy status de todos os records importados. ([Vercel — Managing DNS](https://vercel.com/docs/domains/managing-dns-records))

- **CAA records podem bloquear Let's Encrypt silenciosamente:** se a zona tiver records `CAA` restringindo quais CAs podem emitir certificado, e `letsencrypt.org` não estiver listado, o Traefik vai falhar ao tentar o challenge sem emitir erro visível no Coolify. **Diagnóstico:** `dig CAA thiagopanini.dev +short` — se retornar apenas `sectigo.com` e `pki.goog`, adicione `0 issue "letsencrypt.org"`. ([CAA — RFC 8659](https://www.rfc-editor.org/rfc/rfc8659))

- **DNS em camadas: WSL / Windows / Chrome / VPN com cache independente:** cada camada mantém seu próprio cache DNS e expira em momentos diferentes. Após trocar um record no Cloudflare, `dig @1.1.1.1` pode confirmar o novo valor enquanto o browser ainda retorna o antigo. Diagnóstico por camada:
  - **Autoritativo (fonte da verdade):** `dig +short vps.thiagopanini.dev @1.1.1.1` — se está errado aqui, o problema é no Cloudflare
  - **WSL:** `dig +short vps.thiagopanini.dev` — usa o resolver em `/etc/resolv.conf` (geralmente `10.255.255.254` no WSL2)
  - **Windows:** `powershell.exe -Command "Resolve-DnsName vps.thiagopanini.dev"` ou `ipconfig /flushdns` para limpar
  - **Chrome:** `chrome://net-internals/#dns` → "Clear host cache"; também limpe sockets em `chrome://net-internals/#sockets`
  - **VPN (NordVPN, etc.):** a VPN usa resolvers próprios que cachearão os records antigos pelo TTL. O único remédio é aguardar o TTL expirar (~15-30min) ou configurar DNS customizado na VPN apontando para `1.1.1.1`

- **`server: Vercel` no header é diagnóstico definitivo:** se `curl -sI https://vps.thiagopanini.dev | grep server` retornar `server: Vercel`, a requisição não está chegando à VPS — o DNS ainda aponta para Vercel. Use `dig +short vps.thiagopanini.dev @1.1.1.1` para confirmar e procure wildcards ou records errados na zona Cloudflare.

- **`curl -vI ... | grep 'subject|issuer'` retorna vazio:** o grep captura a linha do TLS handshake do curl, que varia por versão e nem sempre contém essas palavras. Use `openssl s_client` como único método confiável para inspecionar cert de origem:
  ```bash
  echo | openssl s_client -connect <IP>:443 -servername <HOST> 2>/dev/null \
    | openssl x509 -noout -issuer -subject -dates
  ```

- **Delegação de subdomínio é Enterprise:** no Free não dá pra ter `vps.thiagopanini.dev` como zona isolada — daí mover a zona inteira. ([Cloudflare — subdomain setup](https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/setup/))

- **`.dev` é HSTS-preload:** navegador força HTTPS sempre. Não atrapalha o LE (HTTP-01 na porta 80 ignora HSTS); só significa que todo host `.dev` precisa de TLS válido — que a Cloudflare proxied entrega na borda.

- **Docker × UFW:** o Docker injeta regras de iptables antes do UFW; `ufw status` pode mentir. Por isso a validação externa tripla é obrigatória (guide 0002 → Passo 2b; [ufw-docker](https://github.com/chaifeng/ufw-docker)).

- **Janela cinza expõe o IP:** entre criar o record cinza e fechar a origem (Passo 5), o IP da VPS fica resolvível. Minimize; feche a origem assim que os certs emitirem.

- **Coolify domain precisa de `https://`:** sem o prefixo, não provisiona TLS. ([Coolify — DNS Configuration](https://coolify.io/docs/knowledge-base/dns-configuration))

## References

- [Coolify — DNS Configuration](https://coolify.io/docs/knowledge-base/dns-configuration)
- [Coolify — Let's Encrypt not working](https://coolify.io/docs/troubleshoot/dns-and-domains/lets-encrypt-not-working)
- [Coolify #6271 — ACME challenge fails → 526](https://github.com/coollabsio/coolify/issues/6271)
- [Cloudflare — Full (strict) SSL mode](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)
- [Cloudflare — Error 526](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-526/)
- [Cloudflare — Subdomain setup (Enterprise only)](https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/setup/)
- [Cloudflare — Change nameservers (full setup)](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [Vercel — Managing DNS Records](https://vercel.com/docs/domains/managing-dns-records)
- [guide 0002 — mecânica genérica Cloudflare + fechamento de origem](0002-configurar-cloudflare-r2-mcp.md)
- [guide 0001 — VPS Hostinger + Coolify + hardening](0001-criar-vps-hostinger-com-coolify.md)
