# Tutorial — Subir VPS Hostinger com Coolify + Cloudflare

> Sidequest da Fase 0 do roadmap. Resultado esperado ao final: VPS endurecida,
> Coolify acessível por subdomínio com SSL, Cloudflare proxying tráfego,
> firewall só aceitando Cloudflare, backups Postgres apontando para R2.

> Última verificação manual: 2026-05-24. Comandos marcados com `<!-- verificar -->`
> dependem de UI/versão que muda com frequência; revalide na fonte oficial linkada
> na própria seção antes de executar.

Decisões já tomadas que este tutorial implementa, sem revisitar:

- Tamanho da VPS, SO e papel do Coolify: [ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md)
- Cloudflare na frente da VPS, TLS Full (Strict), R2 para backups e assets: [ADR-0006](../adr/0006-cloudflare-na-frente-da-vps.md)
- Deploy via webhook do Coolify acionado por CI: [ADR-0005](../adr/0005-deploy-checks-em-tres-portoes.md) (referência; CI está fora do escopo deste tutorial)

Se algum passo aqui contradiz um ADR, **pare e abra um novo ADR de revisão** — não improvise.

---

## Checklist da sidequest

> Documento vivo. Atualize **neste arquivo versionado** (não em fork pessoal) marcando `- [x]` conforme concluir cada item. Estado serve como handoff entre sessões e para auditoria posterior.

**Caminho desta execução:** VPS Hostinger adquirida com **template Coolify pré-instalado** (Coolify já vem rodando + Docker + Ubuntu). Isso muda a seção 6: em vez de instalar via script, vamos **auditar** o que o template entregou. As demais seções permanecem como descritas.

### Pré-requisitos locais (cobertos na sessão de bootstrap, fora do guia)
- [x] Ferramentas locais: `ssh ≥ 8`, `ssh-keygen`, `dig`, `curl`, `git`, `gitleaks 8.30.1` em `~/.local/bin`
- [x] `~/.ssh/` criado com `700`; `ssh-agent` autostart no `~/.zshrc`
- [x] `.gitignore` cobre `*.key`, `*.pem`, `id_rsa*`, `id_ed25519*`, `id_ecdsa*`
- [x] Caderno local de placeholders em `~/secrets/talkingpres-bootstrap.md` (`700`/`600`)
- [ ] Gerenciador de segredos escolhido (1Password / Bitwarden / `pass` / outro) — bloqueador para guardar passphrase SSH, senha admin Coolify, R2 secret

### Contas e ativos externos (seção 0)
- [x] Conta Hostinger ativa, plano KVM contratado <!-- confirmar KVM 2+ no hPanel -->
- [x] VPS adquirida com template **Coolify pré-instalado**
- [ ] Conta Cloudflare com R2 habilitado
- [ ] Domínio registrado e administrável (acesso ao registrar para trocar nameservers)
- [ ] `<SEU_EMAIL>` definido (alias ops ou pessoal)

### Provisionamento (seção 1)
- [x] Par de chaves `~/.ssh/talkingpres_ed25519` gerado com passphrase
- [ ] Pub key cadastrada na VPS Hostinger (cuidado: template Coolify pode ter pulado o campo SSH key — confira via hPanel ou injete depois via console web)
- [ ] IP público da VPS anotado em `~/secrets/talkingpres-bootstrap.md`
- [ ] Snapshot `pre-hardening` criado (ou plano B se snapshot não estiver disponível no plano)
- [ ] Primeiro `ssh root@<IP>` autenticou via chave (sem pedir senha)

### Hardening base (seções 2–5)
- [ ] Pacotes atualizados (`apt full-upgrade`)
- [ ] Hostname (`<NOME_VPS>`) e timezone (UTC) definidos
- [ ] Usuário `<USUARIO_DEPLOY>` criado com sudo NOPASSWD validado por `visudo -c`
- [ ] Chave SSH replicada para `/home/<USUARIO_DEPLOY>/.ssh/authorized_keys`
- [ ] sshd com `PermitRootLogin no`, `PasswordAuthentication no`, `AllowUsers <USUARIO_DEPLOY>`
- [ ] `ufw` ativo com 22/80/443 (provisório; restringe a Cloudflare na seção 8)
- [ ] `fail2ban` jail `sshd` ativa com `backend = systemd`
- [ ] `unattended-upgrades` configurado para security-only, reboot automático às 04:00 UTC

### Coolify (seção 6 — caminho template)
- [ ] Painel Coolify acessível em `http://<SEU_IP_VPS>:8000` (já deve estar)
- [ ] Versão Coolify anotada (compare com [releases](https://github.com/coollabsio/coolify/releases) — atualizar se muito atrás)
- [ ] Admin Coolify criado com `<SEU_EMAIL>` e senha forte no gerenciador
- [ ] Proxy default confirmado (Traefik per [Apêndice C.1](#c1-coolify-usa-traefik-por-default-não-caddy--resolvido-em-2026-05-24))
- [ ] Portas 8000/6001/6002 liberadas no `ufw` (passo 6.1 — feche depois do DNS na seção 8.3)

### DNS + TLS via Cloudflare (seções 7–9)
- [ ] Zona Cloudflare ativa para `<SEU_DOMINIO>` (nameservers já trocados no registrar)
- [ ] A record `<SUBDOMINIO_COOLIFY>` apontando para `<SEU_IP_VPS>` proxied (nuvem laranja)
- [ ] A `@` e CNAME `www` proxied (prep Fase 1)
- [ ] `dig +short <SUBDOMINIO_COOLIFY>` retorna IPs Cloudflare (não o IP da VPS)
- [ ] Instance domain configurado no Coolify; cert Let's Encrypt emitido pelo Traefik
- [ ] Script `ufw-cloudflare-sync.sh` instalado e aplicado
- [ ] systemd timer `ufw-cloudflare-sync.timer` ativo (mensal)
- [ ] Allow 80/443 genérico + portas Coolify (8000/6001/6002) removidos
- [ ] SSL/TLS Full (strict) ativado na Cloudflare
- [ ] Always Use HTTPS + Min TLS 1.2 + Automatic HTTPS Rewrites = On

### Postgres + Backups R2 (seção 10)
- [ ] Bucket R2 `<R2_BUCKET>` criado
- [ ] Token R2 com `Object Read & Write` escopado ao bucket — `<R2_ACCESS_KEY_ID>` e `<R2_SECRET_ACCESS_KEY>` salvos no gerenciador (secret só aparece uma vez)
- [ ] Destino S3 `r2-talkingpres` adicionado no Coolify e **Test connection** OK
- [ ] Postgres 17 deployado no Coolify com volume local
- [ ] `DATABASE_URL` anotado em `~/secrets/talkingpres-bootstrap.md` (só referência, não a senha)
- [ ] Backup agendado `0 3 * * *` para R2 com retenção ≥ 7
- [ ] Primeiro backup manual concluiu como `Success` e objeto aparece no bucket

### Smoke test ponta a ponta (seção 11)
- [ ] DNS resolve via Cloudflare
- [ ] HTTP → HTTPS redireciona (301/308)
- [ ] TLS Full (Strict) handshake OK
- [ ] Origem inacessível direto (`curl` na 80 da origem dá timeout)
- [ ] SSH root negado / senha negada
- [ ] Backup R2 listável no painel Cloudflare

### Dívida operacional explícita (fora do escopo da sidequest, mas tracking)
- [ ] Documentar runbook de restore mensal do Postgres ([ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md))
- [ ] Decidir se cadastra backup pago da Hostinger ou se snapshot manual + Postgres→R2 são suficientes (provavelmente sim — ver nota na seção 1.3)

---

## 0. Pré-requisitos

**Objetivo da seção:** garantir que tudo que o tutorial assume já esteja em mãos.
**Resultado verificável:** você consegue listar abaixo cada valor real para os placeholders sem precisar olhar para outra aba.

### Contas e ativos

- Conta na **Hostinger** com plano **KVM 2** já contratado (ou superior). KVM 2 = 2 vCPU, 8 GB RAM, 100 GB NVMe — alvo definido no [ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md).
- Domínio registrado e administrável (ex.: `talkingpres.com`). Não precisa estar na Cloudflare ainda; a seção 7 cuida disso.
- Conta na **Cloudflare** (free tier basta) com permissão para adicionar zona e gerar tokens R2.
- Bucket R2 a ser criado (ainda não — instruído na seção 10).
- Máquina local com `ssh`, `ssh-keygen` e um cliente SSH funcional.

### Placeholders usados no tutorial

Antes de copiar qualquer comando, anote os valores reais para os placeholders abaixo. Eles aparecem ao longo do tutorial — substitua na hora de executar, não use o placeholder literal.

| Placeholder | Significado | Exemplo |
|---|---|---|
| `<SEU_IP_VPS>` | IP público IPv4 da VPS, recebido após o provisionamento na Hostinger | `203.0.113.42` |
| `<SEU_DOMINIO>` | Domínio raiz que vai apontar para a VPS | `talkingpres.com` |
| `<SUBDOMINIO_COOLIFY>` | Subdomínio do painel Coolify; recomendado não ser óbvio | `painel.talkingpres.com` |
| `<SEU_EMAIL>` | Email usado em SSH key comment e nas notificações | `voce@exemplo.com` |
| `<USUARIO_DEPLOY>` | Usuário não-root na VPS para operações cotidianas | `deploy` |
| `<NOME_VPS>` | Hostname descritivo da VPS | `talkingpres-prod` |
| `<R2_ACCOUNT_ID>` | Account ID da sua conta Cloudflare (usado no endpoint R2) | `a1b2c3d4e5f6...` |
| `<R2_BUCKET>` | Nome do bucket R2 para backups Postgres | `talkingpres-backups` |
| `<R2_ACCESS_KEY_ID>` | Access Key ID do token R2 com permissão de Object Read & Write | `AKIA...` |
| `<R2_SECRET_ACCESS_KEY>` | Secret Access Key do mesmo token (só aparece uma vez) | `...` |

> ⚠️ Trate `<R2_SECRET_ACCESS_KEY>` como segredo. A Cloudflare só exibe esse valor uma vez no momento da criação do token — copie para um gerenciador de senhas antes de fechar a tela.

### Ferramentas locais

```bash
ssh -V                      # OpenSSH_8.x ou superior
ssh-keygen --help 2>&1 | head -1
```

```text
OpenSSH_9.6p1 ...
usage: ssh-keygen [-q] [-a rounds] ...
```

---

## 1. Provisionar a VPS na Hostinger

**Objetivo:** ter uma VPS Ubuntu 24.04 LTS no plano KVM 2 com SSH key configurada antes do primeiro boot.
**Resultado verificável:** ao final, `ssh root@<SEU_IP_VPS>` autentica usando sua chave privada local, sem pedir senha.

### 1.1 Gerar um par de chaves SSH local (se ainda não tiver)

Use Ed25519 — mais curta, mais rápida, suporte universal em Ubuntu 24.04.

```bash
ssh-keygen -t ed25519 -C "<SEU_EMAIL>" -f ~/.ssh/talkingpres_ed25519   # -C = comentário; -f = path do arquivo
```

```text
Generating public/private ed25519 key pair.
Enter passphrase (empty for no passphrase):
Your identification has been saved in /home/voce/.ssh/talkingpres_ed25519
Your public key has been saved in /home/voce/.ssh/talkingpres_ed25519.pub
```

> ⚠️ Use passphrase. Se a chave privada vazar sem passphrase, o atacante tem acesso direto. Combine com `ssh-agent` para não digitar a cada conexão.

Confirme a pub key:

```bash
cat ~/.ssh/talkingpres_ed25519.pub
```

```text
ssh-ed25519 AAAAC3Nz...XYZ <SEU_EMAIL>
```

### 1.2 Cadastrar a SSH key na Hostinger antes de criar a VPS

> ⚠️ **Caminho template Coolify:** se você comprou a VPS já com o template "Coolify" pré-instalado, o wizard da Hostinger pode ter pulado o campo SSH key (ele aparece na tela de seleção de OS, e o template instala o OS direto). Sintoma: você só tem senha de root, sem chave cadastrada. Resolução: hPanel → VPS → **SSH Access** (ou **SSH Keys**) → adicionar `~/.ssh/talkingpres_ed25519.pub` agora. Alternativa via console web: logar como root com a senha, criar `/root/.ssh/authorized_keys` com `chmod 600`, colar a pub key e seguir.

A UI da Hostinger muda com frequência; o caminho atual: hPanel → **VPS** → entrar na VPS recém-comprada → **Operating System** → opção de instalar OS com SSH key embutida. Documentação oficial: [support.hostinger.com](https://support.hostinger.com/en/collections/944797-vps) <!-- verificar -->.

Procedimento de alto nível, resiliente a pequenas mudanças visuais:

1. Em hPanel, abra a VPS já adquirida (KVM 2).
2. Localize a seção **Operating System** ou **OS & Panel**.
3. Selecione **Ubuntu 24.04 LTS** (sem painéis adicionais como cPanel; queremos o sistema limpo).
4. Procure o campo de **SSH key** (pode estar na mesma tela de seleção de SO ou em **SSH Access** / **Security**). Cole o conteúdo de `~/.ssh/talkingpres_ed25519.pub`.
5. Defina uma **senha de root** longa e única — você vai desabilitá-la logo, mas é o fallback se a chave falhar.
6. Confirme a instalação.

Por que Ubuntu 24.04 e não a mais recente? Ver [ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md). Resumo: é a LTS atual suportada explicitamente pelo installer automático do Coolify (consulte também [Apêndice C](#apêndice-c--divergências-detectadas) sobre Ubuntu 26.04).

### 1.3 Anotar o IP público e habilitar snapshots

Após o provisionamento (geralmente <5 min):

1. Anote o **IPv4** público mostrado em **Overview** → `<SEU_IP_VPS>`.
2. Procure **Snapshots** no menu lateral e crie um snapshot manual com nome `pre-hardening`. Custa pouco e é seu undo de emergência (item explícito de operação no [ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md)).

> 📌 **Snapshot ≠ backup pago.** Snapshot Hostinger = imagem do disco da VPS num ponto no tempo, restaurável em 1 clique pelo hPanel; planos KVM costumam incluir 1 slot manual gratuito <!-- verificar no seu plano específico -->. Backup automatizado da Hostinger = produto pago à parte, que faz cópias recorrentes da VPS inteira e mantém histórico. Para esta sidequest, **snapshot manual basta** como botão de undo antes de tocar em sshd/ufw. Backup contínuo dos dados que importam (Postgres) é coberto pela seção 10 mandando dump diário para R2 — esse é o backup de verdade do projeto, não a VPS inteira. Se o seu plano específico não oferecer nem o snapshot manual: plano B é `pg_dump` manual antes de cada mudança de risco e zero VPS-level rollback (custo aceitável para Fase 0).

### 1.4 Primeiro contato

Antes de qualquer hardening, valide que a chave funciona:

```bash
ssh -i ~/.ssh/talkingpres_ed25519 root@<SEU_IP_VPS>   # -i seleciona a chave privada explicitamente
```

```text
Welcome to Ubuntu 24.04.x LTS (GNU/Linux ...)
root@<NOME_VPS>:~#
```

Se cair direto no prompt, está OK. Se pedir senha, a chave não foi cadastrada — volte ao passo 1.2.

---

## 2. Primeiro acesso e usuário não-root

**Objetivo:** criar um usuário humano com sudo e parar de operar como root.
**Resultado verificável:** `ssh <USUARIO_DEPLOY>@<SEU_IP_VPS>` funciona com sua chave, e `sudo whoami` retorna `root` sem pedir senha (config controlada).

### 2.1 Atualizar pacotes antes de qualquer coisa

```bash
apt update                                # refresh do índice
apt -y full-upgrade                       # aplica todas as atualizações pendentes
apt -y autoremove                         # limpa pacotes órfãos
```

```text
... vários pacotes upgraded ...
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
```

### 2.2 Definir hostname e timezone

```bash
hostnamectl set-hostname <NOME_VPS>
timedatectl set-timezone UTC              # UTC simplifica logs e cron; ajuste se justificável
```

Verifique:

```bash
hostnamectl
timedatectl
```

### 2.3 Criar o usuário de deploy

```bash
adduser <USUARIO_DEPLOY>                  # cria home, pede senha; use senha forte
usermod -aG sudo <USUARIO_DEPLOY>         # adiciona ao grupo sudo
```

Configure sudo sem senha para esse usuário (ele só entra via chave, então o "fator senha" já está coberto pela chave SSH):

```bash
echo "<USUARIO_DEPLOY> ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/90-<USUARIO_DEPLOY>
chmod 0440 /etc/sudoers.d/90-<USUARIO_DEPLOY>
visudo -c                                 # valida sintaxe; quebra do sudoers é desastre
```

```text
/etc/sudoers: parsed OK
/etc/sudoers.d/90-<USUARIO_DEPLOY>: parsed OK
```

> ⚠️ Se `visudo -c` reclamar, NÃO encerre a sessão SSH como root. Corrija com `nano /etc/sudoers.d/90-<USUARIO_DEPLOY>` na sessão aberta — fechar agora com sudoers quebrado pode trancar você fora.

### 2.4 Replicar a chave SSH para o usuário de deploy

```bash
mkdir -p /home/<USUARIO_DEPLOY>/.ssh
cp /root/.ssh/authorized_keys /home/<USUARIO_DEPLOY>/.ssh/authorized_keys
chown -R <USUARIO_DEPLOY>:<USUARIO_DEPLOY> /home/<USUARIO_DEPLOY>/.ssh
chmod 700 /home/<USUARIO_DEPLOY>/.ssh
chmod 600 /home/<USUARIO_DEPLOY>/.ssh/authorized_keys
```

### 2.5 Validar do seu terminal local — abra um SEGUNDO terminal

> ⚠️ **Não feche a sessão SSH atual ainda.** Abra um segundo terminal local e tente o login como `<USUARIO_DEPLOY>`. Se falhar, você ainda tem a sessão root original para corrigir.

No segundo terminal:

```bash
ssh -i ~/.ssh/talkingpres_ed25519 <USUARIO_DEPLOY>@<SEU_IP_VPS>
sudo whoami
```

```text
<USUARIO_DEPLOY>@<NOME_VPS>:~$ sudo whoami
root
```

Funcionou? Então pode encerrar a sessão root original e seguir só com o usuário de deploy.

---

## 3. Hardening do SSH

**Objetivo:** desabilitar login de root via SSH e proibir autenticação por senha.
**Resultado verificável:** `ssh root@<SEU_IP_VPS>` falha imediatamente (root login disabled), e `ssh <USUARIO_DEPLOY>@<SEU_IP_VPS>` só funciona com chave (senha rejeitada).

### 3.1 Editar a configuração do sshd

Em Ubuntu 24.04 o sshd usa um arquivo principal `/etc/ssh/sshd_config` e um diretório `/etc/ssh/sshd_config.d/*.conf` que sobrescreve o principal. Preferimos colocar nossas overrides num arquivo dedicado para sobreviver a `apt upgrade`.

```bash
sudo tee /etc/ssh/sshd_config.d/00-hardening.conf > /dev/null <<'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no
UsePAM yes
X11Forwarding no
MaxAuthTries 3
LoginGraceTime 30s
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers <USUARIO_DEPLOY>
EOF
```

Validar sintaxe **antes** de reiniciar (mesma lógica do `visudo -c`):

```bash
sudo sshd -t                              # exit code 0 e sem output = OK
echo $?
```

```text
0
```

### 3.2 Reiniciar o sshd

```bash
sudo systemctl restart ssh                # nome do serviço em Ubuntu 24.04
sudo systemctl status ssh --no-pager
```

```text
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/lib/systemd/system/ssh.service; enabled; ...)
     Active: active (running) since ...
```

### 3.3 Validar do seu terminal local — de novo, segundo terminal

> ⚠️ Não feche a sessão atual ainda. Abra um terceiro terminal e teste login como root (deve **falhar**) e como deploy (deve **continuar funcionando**).

```bash
ssh root@<SEU_IP_VPS>                                 # esperado: Permission denied (publickey)
ssh -i ~/.ssh/talkingpres_ed25519 <USUARIO_DEPLOY>@<SEU_IP_VPS>     # esperado: sucesso
```

```text
root@<SEU_IP_VPS>: Permission denied (publickey).
```

Se ambos comportamentos forem confirmados, encerre as sessões antigas com tranquilidade.

---

## 4. Firewall (ufw) e fail2ban

**Objetivo:** bloquear todas as portas externas exceto SSH/HTTP/HTTPS e banir IPs que falharem repetidamente no SSH.
**Resultado verificável:** `sudo ufw status` mostra apenas 22/80/443 abertas; `sudo fail2ban-client status sshd` retorna a jail ativa.

Por que `ufw` e não `nftables` direto? `ufw` é um wrapper sobre netfilter pensado para servidor único — basta para o cenário do [ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md). Promover para `nftables` puro é um exagero sem ganho real.

> ⚠️ **Atenção crítica antes de habilitar o ufw:** se você esquecer de permitir SSH (porta 22) e ativar o ufw, vai trancar você fora. Siga a ordem dos comandos abaixo sem pular.

### 4.1 Instalar e configurar regras default

```bash
sudo apt install -y ufw fail2ban unattended-upgrades apt-listchanges
```

```bash
sudo ufw default deny incoming            # bloqueia tudo que entra
sudo ufw default allow outgoing           # libera tudo que sai
sudo ufw allow 22/tcp comment 'SSH'       # SSH primeiro!
sudo ufw allow 80/tcp comment 'HTTP'      # necessário para validar Let's Encrypt do Coolify
sudo ufw allow 443/tcp comment 'HTTPS'    # tráfego principal
```

### 4.2 Habilitar e verificar

```bash
sudo ufw enable                           # vai perguntar; responda y
sudo ufw status verbose
```

```text
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere                   # SSH
80/tcp                     ALLOW IN    Anywhere                   # HTTP
443/tcp                    ALLOW IN    Anywhere                   # HTTPS
```

> ⚠️ Sobre Coolify + Docker + UFW: o Docker registra suas próprias regras de iptables que podem contornar o ufw. Para containers expostos pelo Coolify isso geralmente não causa problema porque o reverse proxy é quem expõe, mas se você publicar uma porta de container manualmente, esteja ciente. Workaround comum é o projeto [`ufw-docker`](https://github.com/chaifeng/ufw-docker) — só introduza se medir um vazamento real.

### 4.3 Configurar fail2ban para o sshd

Em Ubuntu 24.04 o pacote `fail2ban` requer um arquivo `jail.local` (nunca edite `jail.conf` direto):

```bash
sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = systemd

[sshd]
enabled = true
port    = 22
EOF
```

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

```text
Status for the jail: sshd
|- Filter
|  |- Currently failed: 0
|  |- Total failed:     0
|  `- File list:        /var/log/auth.log   # (em Ubuntu 24.04, via systemd journal)
`- Actions
   |- Currently banned: 0
   |- Total banned:     0
   `- Banned IP list:
```

`backend = systemd` é importante em Ubuntu 24.04 porque o journald é o destino padrão dos logs do sshd. Doc de referência: [fail2ban man page](https://github.com/fail2ban/fail2ban). <!-- verificar -->

---

## 5. Atualizações automáticas (unattended-upgrades)

**Objetivo:** o sistema aplica patches de segurança sozinho, com notificação por email opcional.
**Resultado verificável:** `unattended-upgrade --dry-run --debug` lista pacotes que seriam atualizados sem erro.

`unattended-upgrades` já foi instalado no passo 4.1. Falta habilitar e configurar.

### 5.1 Ativar o serviço

```bash
sudo dpkg-reconfigure -plow unattended-upgrades
```

Na pergunta "Automatically download and install stable updates?" → **Yes**.

Isso cria/atualiza `/etc/apt/apt.conf.d/20auto-upgrades` com:

```text
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

### 5.2 Restringir a updates de segurança e habilitar reboot automático

Edite `/etc/apt/apt.conf.d/50unattended-upgrades`:

```bash
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

Verifique/ajuste estas chaves (descomente removendo `//`):

```text
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::Mail "<SEU_EMAIL>";
Unattended-Upgrade::MailReport "on-change";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";
```

Reboot automático às 04:00 UTC vale a pena para patches de kernel; janela é pequena e horário é vale. Se você está em horário comercial brasileiro durante esse intervalo, ajuste.

### 5.3 Testar em modo dry-run

```bash
sudo unattended-upgrade --dry-run --debug 2>&1 | tail -30
```

```text
Initial blacklist:
Initial whitelist (not strict):
Starting unattended upgrades script
Allowed origins are: ...
No packages found that can be upgraded unattended and no pending auto-removals
```

Sem erros = configurado.

---

## 6. Instalar Coolify

**Objetivo:** Coolify rodando e acessível por HTTP no IP da VPS, ainda sem domínio.
**Resultado verificável:** `http://<SEU_IP_VPS>:8000` carrega a tela de registro inicial do Coolify e você consegue criar o usuário admin.

Por que Coolify e não docker-compose puro? Custo de manutenção e ganho de DX justificam — análise completa no [ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md), seção "Comparativo de orquestradores".

> ⚠️ **Caminho template Coolify:** se você comprou a VPS já com o template "Coolify" da Hostinger, **pule 6.1 e 6.2** — o Docker e o Coolify já estão instalados. Vá direto para a **6.0 (Auditoria do template)** abaixo, depois pule para 6.3 (criar admin). As portas 8000/6001/6002 já vêm abertas no host pelo template, mas o `ufw` que você configurou na seção 4 está bloqueando 8000 a partir de fora — vai precisar abrir explicitamente como em 6.1.

### 6.0 Auditoria do template Coolify (só caminho template)

Antes de criar o admin, confirme o que o template entregou — assim você sabe o que ainda falta fazer manualmente.

```bash
# Containers Coolify rodando
sudo docker ps --filter 'name=coolify' --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'

# Versão da imagem principal
sudo docker inspect coolify --format '{{.Config.Image}}' 2>/dev/null

# Proxy default (esperado: traefik; ver Apêndice C.1)
sudo docker ps --filter 'name=proxy' --format '{{.Names}} {{.Image}}'

# Portas abertas no host pelo Coolify
sudo ss -tlnp | grep -E ':(8000|6001|6002)\b'

# Diretório de dados
sudo ls -la /data/coolify 2>/dev/null | head
```

Resultado esperado: 4-5 containers `coolify*` em `Up`, proxy Traefik presente, portas 8000/6001/6002 escutando, `/data/coolify` existe.

Checklist de auditoria do template:

- [ ] Versão Coolify dentro de N-2 das últimas releases — atualizar via painel Coolify → **Settings** → **Update** se muito desatualizada
- [ ] Proxy default é Traefik (alinhado com [Apêndice C.1](#c1-coolify-usa-traefik-por-default-não-caddy--resolvido-em-2026-05-24))
- [ ] `/data/coolify` existe e tem subdiretórios `source/`, `proxy/`, `databases/`
- [ ] Nenhum admin pré-criado pela Hostinger (você cria do zero em 6.3; se houver admin default, **redefina senha imediatamente**)
- [ ] Hardening da seção 2-5 já aplicado **antes** de expor o painel — template não faz hardening, só sobe o Coolify

Se algo da auditoria divergir, decida: aceitar e documentar no [Apêndice C](#apêndice-c--divergências-detectadas), ou desinstalar e reinstalar pelo script (seção 6.2 do caminho padrão).

### 6.1 Liberar temporariamente as portas do Coolify

O installer expõe inicialmente o painel em HTTP na 8000 e canais de tempo real em 6001/6002 ([doc oficial](https://coolify.io/docs/knowledge-base/server/firewall)). Vamos abrir essas portas só agora — depois que houver domínio + TLS via Cloudflare, fechamos novamente (seção 8).

```bash
sudo ufw allow 8000/tcp comment 'Coolify dashboard (temporário)'
sudo ufw allow 6001/tcp comment 'Coolify realtime (temporário)'
sudo ufw allow 6002/tcp comment 'Coolify terminal (temporário)'
```

### 6.2 Rodar o installer oficial

Comando oficial documentado em [coolify.io/docs/get-started/installation](https://coolify.io/docs/get-started/installation):

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

O script:

1. Instala Docker Engine se faltar.
2. Cria diretórios em `/data/coolify`.
3. Sobe os containers do Coolify (web + worker + db + redis).
4. Imprime a URL final com a porta 8000.

```text
... (várias linhas) ...
Coolify is installed!
Visit http://<SEU_IP_VPS>:8000 in your browser to access Coolify.
```

### 6.3 Criar o usuário root do Coolify

Abra `http://<SEU_IP_VPS>:8000` (HTTP é OK por enquanto; vamos para HTTPS já já). Crie o usuário inicial com `<SEU_EMAIL>` e uma senha forte armazenada no gerenciador de senhas.

> ⚠️ Não use o mesmo email/senha do hPanel. Coolify guarda o admin no banco local; se vazar, atacante tem acesso à orquestração toda.

### 6.4 (Opcional) Validar versão e proxy default

No painel Coolify → **Servers** → seu servidor → **Proxy** mostra `Traefik` como proxy default. Esta é a divergência com o ADR-0003 anotada no [Apêndice C](#apêndice-c--divergências-detectadas) — sigamos com Traefik (default oficial).

---

## 7. Configurar DNS no Cloudflare apontando para a VPS

**Objetivo:** `<SUBDOMINIO_COOLIFY>` resolve para o IP da VPS via Cloudflare, com proxy ligado.
**Resultado verificável:** `dig <SUBDOMINIO_COOLIFY>` retorna um IP que **não** é o `<SEU_IP_VPS>` (é um IP de POP Cloudflare), confirmando que o proxy está ativo.

### 7.1 Adicionar a zona no Cloudflare

1. Cloudflare Dashboard → **Add a site** → digite `<SEU_DOMINIO>` → escolha o plano **Free**.
2. A Cloudflare faz um scan inicial das DNS records existentes (no seu registrar atual). Revise e mantenha apenas o que faz sentido (MX, TXT relevantes); registros A apontando para infra antiga você vai sobrescrever no próximo passo.
3. Cloudflare exibe **dois nameservers** atribuídos à sua zona (algo como `xxx.ns.cloudflare.com`). No painel do **registrar do domínio** (onde o domínio foi comprado — não a Hostinger necessariamente, mas pode ser ela), substitua os nameservers pelos dois indicados.
4. Espere a propagação (minutos a horas). A Cloudflare envia email confirmando "site is active".

Doc oficial: [developers.cloudflare.com/dns/zone-setups](https://developers.cloudflare.com/dns/zone-setups/) <!-- verificar -->.

### 7.2 Criar o A record para o painel Coolify

Já na zona ativa:

1. Cloudflare Dashboard → sua zona `<SEU_DOMINIO>` → **DNS** → **Records** → **Add record**.
2. **Type:** `A`
3. **Name:** `<SUBDOMINIO_COOLIFY>` sem o domínio raiz (ex.: `painel`, não `painel.talkingpres.com`).
4. **IPv4 address:** `<SEU_IP_VPS>`
5. **Proxy status:** **Proxied** (nuvem laranja). Esta é a parte central do [ADR-0006](../adr/0006-cloudflare-na-frente-da-vps.md): origem nunca aparece em DNS público.
6. **TTL:** Auto (a Cloudflare ignora quando o proxy está ligado).
7. **Save**.

Doc oficial: [developers.cloudflare.com/dns/manage-dns-records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/).

### 7.3 Repetir para o domínio raiz e `www` (preparando Fase 1)

Para já deixar pronto para quando `apps/web` subir (Fase 1):

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `<SEU_IP_VPS>` | Proxied |
| CNAME | `www` | `<SEU_DOMINIO>` | Proxied |

Esses dois ainda não vão servir nada até o Coolify ter um app publicado — você vai mexer no Coolify depois para vincular esses domínios à app web. Por enquanto, ter os registros DNS prontos não atrapalha.

### 7.4 Validar resolução

```bash
dig +short <SUBDOMINIO_COOLIFY>           # +short = só os endereços
```

```text
104.21.x.x
172.67.y.y
```

Os IPs retornados **não** são o `<SEU_IP_VPS>` — são IPs de POPs Cloudflare. Isso confirma que o proxy está intermediando. Se aparecer o IP da VPS, o proxy não está ativado (nuvem cinza); volte ao 7.2.

### 7.5 Apontar o Coolify para o subdomínio

No painel Coolify → **Settings** → **General** → campo "Instance domain" (ou equivalente) → preencha `https://<SUBDOMINIO_COOLIFY>` → **Save**. O Coolify vai pedir o Traefik para emitir certificado Let's Encrypt assim que detectar tráfego nesse hostname.

Aguarde 1-2 minutos e tente `https://<SUBDOMINIO_COOLIFY>` no browser. Deve carregar o painel via HTTPS. Se der erro 526 ou 525 da Cloudflare, o cert ainda não foi emitido — espere mais um minuto e tente de novo.

---

## 8. Restringir firewall para aceitar só IPs da Cloudflare

**Objetivo:** depois de DNS funcionando e proxy ativo, a VPS não precisa mais aceitar 80/443 do mundo todo — apenas dos ranges Cloudflare. Também fechamos 8000/6001/6002 do Coolify, já acessíveis pelo subdomínio.
**Resultado verificável:** `curl -I http://<SEU_IP_VPS>` direto na origem trava (sem resposta) ou expira; `curl -I https://<SUBDOMINIO_COOLIFY>` retorna `HTTP/2 200` ou `302`.

> ⚠️ **Faça esta seção SÓ depois da seção 7 estar funcionando.** Se você restringir o firewall antes do DNS Cloudflare estar ativo, o próprio Let's Encrypt do Traefik (que faz challenge HTTP-01 a partir de IPs aleatórios) não consegue completar e o painel fica sem cert.

### 8.1 Buscar a lista atualizada de IPs Cloudflare

A Cloudflare publica os ranges em URLs estáveis. **Não copie a lista para o tutorial — sempre busque online no momento de aplicar**, porque os ranges mudam (raramente, mas mudam).

- IPv4: `https://www.cloudflare.com/ips-v4`
- IPv6: `https://www.cloudflare.com/ips-v6`
- Página geral: [cloudflare.com/ips](https://www.cloudflare.com/ips/)

Por isso o tutorial usa um script que baixa e aplica no momento, em vez de listar CIDRs hardcoded:

```bash
sudo tee /usr/local/sbin/ufw-cloudflare-sync.sh > /dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Remove regras antigas marcadas como 'cloudflare'
for n in $(sudo ufw status numbered | awk -F'[][]' '/cloudflare/ {print $2}' | sort -rn); do
    yes | sudo ufw delete "$n" >/dev/null
done

# Adiciona ranges atuais
for cidr in $(curl -fsSL https://www.cloudflare.com/ips-v4); do
    sudo ufw allow proto tcp from "$cidr" to any port 80 comment 'cloudflare-v4'
    sudo ufw allow proto tcp from "$cidr" to any port 443 comment 'cloudflare-v4'
done

for cidr in $(curl -fsSL https://www.cloudflare.com/ips-v6); do
    sudo ufw allow proto tcp from "$cidr" to any port 80 comment 'cloudflare-v6'
    sudo ufw allow proto tcp from "$cidr" to any port 443 comment 'cloudflare-v6'
done

sudo ufw reload
EOF
sudo chmod +x /usr/local/sbin/ufw-cloudflare-sync.sh
```

### 8.2 Aplicar pela primeira vez

```bash
sudo /usr/local/sbin/ufw-cloudflare-sync.sh
```

### 8.3 Remover as regras genéricas de 80/443 e portas internas do Coolify

```bash
sudo ufw delete allow 80/tcp              # remove o allow geral; só Cloudflare passa agora
sudo ufw delete allow 443/tcp
sudo ufw delete allow 8000/tcp            # painel Coolify agora chega via subdomínio
sudo ufw delete allow 6001/tcp
sudo ufw delete allow 6002/tcp
sudo ufw reload
sudo ufw status verbose
```

```text
Status: active
...
22/tcp                     ALLOW IN    Anywhere                   # SSH
80/tcp                     ALLOW IN    173.245.48.0/20            # cloudflare-v4
443/tcp                    ALLOW IN    173.245.48.0/20            # cloudflare-v4
... (várias linhas, uma por range Cloudflare) ...
```

### 8.4 Agendar a sincronização periódica

Os ranges Cloudflare mudam raramente, mas quando mudam, sua origem fica inacessível em silêncio. Agendamos uma sync mensal:

```bash
sudo tee /etc/systemd/system/ufw-cloudflare-sync.service > /dev/null <<'EOF'
[Unit]
Description=Sync ufw allowlist with Cloudflare IP ranges
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/ufw-cloudflare-sync.sh
EOF
```

```bash
sudo tee /etc/systemd/system/ufw-cloudflare-sync.timer > /dev/null <<'EOF'
[Unit]
Description=Run Cloudflare IP sync monthly

[Timer]
OnCalendar=monthly
Persistent=true

[Install]
WantedBy=timers.target
EOF
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ufw-cloudflare-sync.timer
sudo systemctl list-timers | grep cloudflare
```

```text
... ufw-cloudflare-sync.timer  ufw-cloudflare-sync.service
```

### 8.5 Validação cruzada

De fora da VPS, tente acessar a origem direto (deve falhar) e via Cloudflare (deve funcionar):

```bash
curl -I --max-time 5 http://<SEU_IP_VPS>           # esperado: falha por timeout
curl -I https://<SUBDOMINIO_COOLIFY>               # esperado: HTTP/2 200 ou 302
```

```text
curl: (28) Connection timed out after 5001 milliseconds
HTTP/2 302
server: cloudflare
...
```

Origem escondida, proxy entregando — exatamente como o [ADR-0006](../adr/0006-cloudflare-na-frente-da-vps.md) descreve.

---

## 9. Configurar TLS Full (Strict) entre Cloudflare e origem

**Objetivo:** garantir que a conexão Cloudflare → VPS também seja TLS com cert válido, não só user → Cloudflare.
**Resultado verificável:** no SSL/TLS Overview da Cloudflare aparece "Full (strict)" selecionado; `curl -v https://<SUBDOMINIO_COOLIFY>` mostra TLS handshake bem-sucedido sem `--insecure`.

Por que `Full (Strict)` e não `Flexible`? Em `Flexible`, Cloudflare ↔ origem é HTTP — qualquer um na rota interna pode ler o tráfego. Decisão registrada no [ADR-0006](../adr/0006-cloudflare-na-frente-da-vps.md). Doc oficial: [developers.cloudflare.com/ssl/origin-configuration/ssl-modes](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/).

### 9.1 Confirmar que o Coolify já emitiu cert Let's Encrypt para `<SUBDOMINIO_COOLIFY>`

Já validado no passo 7.5 (HTTPS no painel funcionou). Esse cert vale para o nome de host — é exatamente o que `Full (Strict)` exige.

### 9.2 Mudar o modo de criptografia na Cloudflare

1. Cloudflare Dashboard → zona `<SEU_DOMINIO>` → menu lateral **SSL/TLS** → **Overview**.
2. Em **SSL/TLS encryption**, selecione **Full (strict)**.
3. Salve.

> ⚠️ Se o cert da origem for inválido (expirado, hostname errado, self-signed), `Full (Strict)` quebra o acesso e exibe erro 526. Garanta que a etapa 9.1 passou antes de mudar o modo.

### 9.3 Habilitar opções complementares recomendadas

Ainda em **SSL/TLS**:

- **Edge Certificates** → **Always Use HTTPS** = **On** (redireciona HTTP → HTTPS na borda).
- **Edge Certificates** → **Minimum TLS Version** = **TLS 1.2** (1.0 e 1.1 são deprecated).
- **Edge Certificates** → **Automatic HTTPS Rewrites** = **On**.

### 9.4 Validar

Do seu terminal local:

```bash
curl -vI https://<SUBDOMINIO_COOLIFY> 2>&1 | grep -Ei 'ssl|tls|http/'
```

```text
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
* ALPN: server accepted h2
HTTP/2 302
```

TLS 1.3 da borda → ✓. Acesse `http://<SUBDOMINIO_COOLIFY>` no browser e confirme redirecionamento automático para HTTPS.

---

## 10. Subir Postgres via Coolify e configurar backup para R2

**Objetivo:** ter um PostgreSQL 17 rodando como serviço gerenciado pelo Coolify, com volume persistente, com backup diário enviado para R2.
**Resultado verificável:** no painel Coolify, na aba **Backups** da instância Postgres, aparece pelo menos um backup com status "Success" listando o destino R2.

### 10.1 Criar o bucket e o token R2 na Cloudflare

1. Cloudflare Dashboard → menu **R2** (ou **Storage & databases → R2**) → **Overview**.
2. **Create bucket** → nome `<R2_BUCKET>` → location automatic → criar.
3. Dentro do R2 Overview, **Manage API Tokens** (ou **API Tokens**) → **Create API Token**.
4. **Permissions:** `Object Read & Write`.
5. **Apply to specific buckets only:** selecione `<R2_BUCKET>`.
6. **TTL:** sem expiração (ou rotacione manualmente; sua escolha de operação).
7. **Create API Token**.
8. Copie imediatamente: `<R2_ACCESS_KEY_ID>` e `<R2_SECRET_ACCESS_KEY>`. **O secret só aparece uma vez.** Anote também o **S3 endpoint** mostrado — deve ser `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`.

Doc oficial: [developers.cloudflare.com/r2/api/tokens](https://developers.cloudflare.com/r2/api/tokens/).

### 10.2 Registrar o destino S3 no Coolify

No painel Coolify:

1. **Settings** → **Backups** (ou em algumas versões: **Server → Destinations / S3 Storage**). <!-- verificar -->
2. **Add S3 Storage** com:
   - **Name:** `r2-talkingpres`
   - **Endpoint:** `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`
   - **Bucket:** `<R2_BUCKET>`
   - **Region:** `auto` (R2 ignora region, mas o cliente S3 exige preenchimento; `auto` é o convencional)
   - **Access Key ID:** `<R2_ACCESS_KEY_ID>`
   - **Secret Access Key:** `<R2_SECRET_ACCESS_KEY>`
3. **Test connection**. Deve retornar sucesso. Se falhar, valide endpoint e permissão do token.

Referência: [coolify.io/docs/knowledge-base/s3/r2](https://coolify.io/docs/knowledge-base/s3/r2).

### 10.3 Criar a instância Postgres

1. No painel Coolify → **Projects** → crie projeto `talkingpres` (se ainda não existir).
2. Dentro do projeto, **+ New Resource** → **Database** → **PostgreSQL 17**.
3. Em opções:
   - **Postgres User:** `talkingpres`
   - **Postgres Database:** `talkingpres`
   - **Volume persistente:** **mantenha local** — o [ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md) é explícito que o volume é local, não network storage.
4. **Deploy**.

A instância sobe em ~1 min. Anote o `DATABASE_URL` gerado — vai ser usado por `apps/api` na Fase 0/1.

### 10.4 Configurar backup diário para R2

Na instância Postgres recém-criada, aba **Backups**:

1. **Enable scheduled backups.**
2. **Schedule (cron):** `0 3 * * *` — diário às 03:00 (UTC; ajuste se a janela conflita com algo).
3. **Save to S3:** ative.
4. **S3 destination:** selecione `r2-talkingpres`.
5. **Retention:** mantenha pelo menos 7 backups (uma semana de pontos de restauração; recomendação do [ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md)).
6. **Save**.

### 10.5 Disparar um backup imediato para validar

Mesma aba **Backups** → **Backup now** (ou equivalente).

Aguarde até o status virar **Success**. Em paralelo, na UI R2 da Cloudflare, abra o bucket — você deve ver um objeto `*.dump` ou `*.sql.gz` recém-criado.

> ⚠️ **Backup não testado não é backup.** O [ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md) prevê teste de restore mensal. Documente em runbook quando você executar o primeiro restore real; fica fora do escopo deste tutorial mas é dívida operacional explícita.

---

## 11. Smoke test ponta a ponta

**Objetivo:** validar que tudo que acabou de ser montado segue funcionando junto, em condições próximas das reais.
**Resultado verificável:** os 6 checks abaixo passam em sequência, sem erro.

Execute cada check do seu terminal local. Se algum falhar, volte à seção indicada na coluna "se falhar".

| # | Check | Comando | Resultado esperado | Se falhar |
|---|---|---|---|---|
| 1 | DNS resolve via Cloudflare | `dig +short <SUBDOMINIO_COOLIFY>` | IPs Cloudflare (não o IP da VPS) | Seção 7 |
| 2 | HTTP redireciona para HTTPS | `curl -sI http://<SUBDOMINIO_COOLIFY>` | `HTTP/.. 301` ou `308` com `location: https://...` | Seção 9.3 |
| 3 | TLS Full (Strict) funciona | `curl -vI https://<SUBDOMINIO_COOLIFY> 2>&1 \| grep -i 'tls\|http/2'` | Linhas com `TLSv1.2` ou `TLSv1.3` e `HTTP/2 200/302` | Seções 9.1 e 9.2 |
| 4 | Origem está fechada para o mundo | `curl -I --max-time 5 http://<SEU_IP_VPS>` | Connection timed out | Seção 8.3 |
| 5 | SSH só com chave, sem root | `ssh root@<SEU_IP_VPS>` e `ssh -o PreferredAuthentications=password <USUARIO_DEPLOY>@<SEU_IP_VPS>` | Ambos falham com `Permission denied (publickey)` | Seção 3 |
| 6 | Backup R2 listável | Painel R2 da Cloudflare → bucket `<R2_BUCKET>` | Pelo menos 1 objeto `.dump`/`.sql.gz` recente | Seção 10.4 |

Critério de sucesso da sidequest: **os 6 checks acima passam.** Sem isso, não considere a infra da Fase 0 fechada.

---

## 12. Próximos passos (fora do escopo deste tutorial)

A Fase 0 do [ROADMAP](../ROADMAP.md) tem itens além de infra. Após este tutorial passar no smoke test, ainda falta para fechar a fase:

- **CI em GitHub Actions com lint + typecheck + testes em PR** — ver [ROADMAP.md](../ROADMAP.md) e [ADR-0005](../adr/0005-deploy-checks-em-tres-portoes.md).
- **Branch protection na `main`** (PR obrigatório, CI verde, sem force-push) — [ROADMAP.md](../ROADMAP.md).
- **`gitleaks` no CI** para secret scanning — [ROADMAP.md](../ROADMAP.md).
- **Skeleton do monorepo** com `apps/web` (Next.js 15) e `apps/api` (FastAPI) ambos com "hello world" — [ROADMAP.md](../ROADMAP.md).
- **Docker Compose local** com Postgres para desenvolvimento — [ROADMAP.md](../ROADMAP.md).
- **`docs/CONTEXT.md`** preenchido via sessão `grill-with-docs` — [ROADMAP.md](../ROADMAP.md).
- **`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`** — [ROADMAP.md](../ROADMAP.md).
- **Deploy "hello world"** acionado por webhook do Coolify ao merge na `main` — encerramento natural da Fase 0, ver [ADR-0005](../adr/0005-deploy-checks-em-tres-portoes.md).

A integração entre GitHub Actions e Coolify (webhook do portão 3) acontece quando `apps/web` e `apps/api` estiverem no repo — não há nada a fazer no Coolify para isso ainda além de gerar o webhook URL quando os apps existirem.

---

## Apêndice A — Troubleshooting comum

### A.1 Coolify responde `Bad Gateway` (502) via Cloudflare

Causa típica: Traefik dentro do Coolify ainda não emitiu cert Let's Encrypt para `<SUBDOMINIO_COOLIFY>`. Combinado com `Full (Strict)` da Cloudflare, isso fecha o canal.

Diagnóstico:

```bash
sudo docker logs coolify-proxy 2>&1 | grep -i acme | tail -20
```

Aguardar 1-2 min após apontar DNS e configurar domínio no Coolify costuma resolver. Se persistir, valide se o A record realmente está com proxy laranja e se 80/443 estão liberados para Cloudflare (passo 8.2).

### A.2 `Connection refused` no SSH após hardening

Causa típica: `AllowUsers <USUARIO_DEPLOY>` foi escrito com placeholder literal em vez do nome real, ou o nome do usuário está errado.

Recuperação: use o **console web** da Hostinger (hPanel → VPS → Console / Browser Terminal) para entrar como root via senha (não passa pelo sshd) e corrigir `/etc/ssh/sshd_config.d/00-hardening.conf`.

### A.3 Cloudflare exibe erro 525 ou 526

- **525 (SSL Handshake Failed):** origem não fala TLS, ou cert da origem expirou.
- **526 (Invalid SSL Certificate):** cert da origem é self-signed, expirou, ou hostname não bate. Em `Full (Strict)`, é fatal.

Cheque `https://<SUBDOMINIO_COOLIFY>` com `curl --resolve <SUBDOMINIO_COOLIFY>:443:<SEU_IP_VPS>` (pulando a Cloudflare, **se o firewall ainda permitir o seu IP**) para ver o cert direto.

### A.4 `fail2ban-client status sshd` retorna "sshd jail does not exist"

Causa típica em Ubuntu 24.04: `backend` não está como `systemd` no `jail.local`. O default `auto` falha porque não há `/var/log/auth.log` por padrão (journald é o destino).

Correção: a configuração da seção 4.3 já usa `backend = systemd`. Confira o arquivo e `sudo systemctl restart fail2ban`.

### A.5 Backup do Postgres falha com `Access Denied` no R2

Causa típica: token R2 escopado a outro bucket, ou permissão não inclui Write.

Correção: na Cloudflare R2 → API Tokens → recriar token com `Object Read & Write` e escopo no bucket correto. Atualizar credenciais no Coolify (Settings → Backups → editar destino).

### A.6 Coolify atualizou sozinho e o painel sumiu

Coolify auto-update mexe em containers e raramente em config de proxy. Procedimento de recuperação:

```bash
sudo docker ps -a | grep coolify          # ver quais containers estão down
sudo docker logs coolify --tail=100       # logs do container principal
```

Se ainda corrupto, use o snapshot `pre-hardening` (criado no 1.3) — last resort. Antes disso, abra o painel pelo IP direto (depois de liberar a porta 8000 temporariamente) e verifique se há mensagem do próprio Coolify.

---

## Apêndice B — Rollback / desfazer

Plano de reversão por seção, do mais barato para o mais caro. Use o snapshot Hostinger como último recurso (`pre-hardening` da seção 1.3 ou o mais recente automático).

### B.1 Reabrir 80/443 para o mundo (desfazer seção 8)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo systemctl disable --now ufw-cloudflare-sync.timer
# remover regras 'cloudflare-*' do ufw:
for n in $(sudo ufw status numbered | awk -F'[][]' '/cloudflare/ {print $2}' | sort -rn); do
    yes | sudo ufw delete "$n"
done
```

### B.2 Reverter Cloudflare para Flexible (desfazer seção 9)

Cloudflare Dashboard → SSL/TLS → Overview → marcar **Flexible**. Use apenas em emergência: TLS Cloudflare ↔ origem volta a ser HTTP em texto claro.

### B.3 Desabilitar proxy Cloudflare (desfazer seção 7)

Cloudflare Dashboard → DNS → editar A record `<SUBDOMINIO_COOLIFY>` → **Proxy status** → DNS only (nuvem cinza). IP da VPS volta a ser público. Útil só para debug; reverta assim que possível.

### B.4 Desinstalar Coolify (desfazer seção 6)

```bash
sudo docker compose -f /data/coolify/source/docker-compose.yml down -v   # remove containers e volumes
sudo rm -rf /data/coolify
```

> ⚠️ `-v` apaga volumes — incluindo o Postgres. Faça backup antes (passo 10.5 ou `pg_dump` manual).

### B.5 Reativar SSH por senha (desfazer seção 3)

```bash
sudo rm /etc/ssh/sshd_config.d/00-hardening.conf
sudo sshd -t && sudo systemctl restart ssh
```

Faça apenas se você perdeu acesso à chave privada e está no console web da Hostinger.

### B.6 Restaurar do snapshot

hPanel → VPS → Snapshots → escolher `pre-hardening` ou o automático mais recente → **Restore**. Reverte a VPS inteira ao estado anterior. Backup de dados pós-snapshot é perdido — por isso o backup Postgres em R2 (seção 10) é crítico.

---

## Apêndice C — Divergências detectadas

Itens onde a leitura crítica das fontes oficiais diverge do que algum ADR diz. **Nenhum foi aplicado no tutorial** — todos seguem o ADR original. Estes pontos ficam aqui para você decidir se viram novo ADR ou revisão dos existentes.

### C.1 Coolify usa Traefik por default, não Caddy ✅ resolvido em 2026-05-24

- **ADR-0003** ([0003-infra-hostinger-vps-coolify.md](../adr/0003-infra-hostinger-vps-coolify.md)) descrevia "Caddy como reverse proxy com SSL automático (Let's Encrypt)".
- **Documentação oficial Coolify atual** ([coolify.io/docs/knowledge-base/server/proxies](https://coolify.io/docs/knowledge-base/server/proxies)) diz que Traefik é o default e Caddy é experimental. [coolify.io/docs/knowledge-base/proxy/caddy/overview](https://coolify.io/docs/knowledge-base/proxy/caddy/overview) recomenda explicitamente Traefik para a maioria dos setups.
- **O tutorial segue o default (Traefik)** porque (a) é o que o installer entrega, (b) é o que a doc oficial recomenda manter, (c) o objetivo do ADR-0003 ("reverse proxy com SSL automático") é cumprido por qualquer um dos dois.
- **Status:** ADR-0003 atualizado em 2026-05-24 substituindo "Caddy" por "Traefik (default do Coolify)" e registrando o motivo na seção Histórico do ADR. Divergência fechada.

### C.2 Ubuntu 26.04 LTS foi lançado, mas tutorial mantém 24.04

- **ADR-0003** ([0003-infra-hostinger-vps-coolify.md](../adr/0003-infra-hostinger-vps-coolify.md)) especifica Ubuntu 24.04 LTS.
- **Realidade em 2026-05-24:** Ubuntu 26.04 LTS (Resolute Raccoon) foi lançado em abril/2026. Upgrades diretos só liberados a partir de 26.04.1 (previsto agosto/2026). Installer automático do Coolify lista suporte para 20.04/22.04/24.04 — 26.04 ainda não.
- **O tutorial segue 24.04** porque o ADR pede, o installer do Coolify garante, e a recomendação Canonical é aguardar 26.04.1 para servidores de produção.
- **Recomendação para humano revisor:** não revisar agora. Reabrir o ADR após Coolify suportar 26.04 explicitamente E 26.04.1 ter saído.

### C.3 Coolify usa portas extras (6001, 6002) além de 8000

- **ADR-0003** não menciona portas adicionais — diz apenas "Coolify gerencia Caddy / containers".
- **Doc oficial** ([coolify.io/docs/knowledge-base/server/firewall](https://coolify.io/docs/knowledge-base/server/firewall)) cita explicitamente 8000 (dashboard HTTP), 6001 (real-time) e 6002 (terminal access, ≥ 4.0.0-beta.336).
- **O tutorial abre e fecha as três portas explicitamente** (seções 6.1 e 8.3). Não é divergência de decisão, é detalhe operacional que não está no ADR — registro aqui para o ADR poder absorver se útil.
- **Recomendação para humano revisor:** opcional incluir as portas no ADR-0003 na próxima revisão para reduzir descoberta repetida pelos futuros agentes.
