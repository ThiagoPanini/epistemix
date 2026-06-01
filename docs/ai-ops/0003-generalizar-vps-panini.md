---
data: 2026-05-31
operacao: generalização da VPS — desacoplar de um único projeto (talkingpres → panini-vps)
maquina: talkingpres-prod → panini-vps (Hostinger KVM 2, Ubuntu 24.04 LTS)
operador: Thiago Panini
agente: Claude Code
resultado: success
dividas:
  - migração dos itens no gerenciador de segredos `talkingpres/` → `panini-vps/` pendente (sem CLI `bw` na sessão)
  - chave antiga `~/.ssh/talkingpres_ed25519` mantida como backup; remover após validar a nova
  - re-adicionar passphrase à `panini_vps_ed25519` se um dia for tratada como chave independente da antiga (hoje é o mesmo par)
  - drift pré-existente em `/etc/hosts` (linhas 127.0.1.1 com nomes de fábrica `srv1700377`/`ubuntu-24-coolify`, geridas por cloud-init) — alheio a este trabalho, anotado para limpeza futura
referencias:
  adr: ../adr/0016-vps-agnostica-multi-projeto.md
  setup_anterior: 0002-hardening-talkingpres-prod.md
  runbook: ../runbooks/0001-operacao-vps.md
---

# 20260531 — Generalização da VPS: de talkingpres-prod para panini-vps

Registro narrativo da sessão em que a VPS de produção deixou de ser "a máquina do talkingpres" e virou infra agnóstica `panini-vps`, capaz de hospedar múltiplos projetos. O **porquê** está no [ADR-0016](../adr/0016-vps-agnostica-multi-projeto.md). Este documento registra **o que efetivamente mudamos nesta data**, em continuação ao [setup inicial](0001-setup-inicial-talkingpres-prod.md) e ao [hardening](0002-hardening-talkingpres-prod.md).

## Cenário

- Pivô de produto `talkingpres` → `epistemix` já feito nos docs (commit `docs(pivot)`) e no repositório GitHub (renomeado para `ThiagoPanini/epistemix`).
- Decisão de construir **outros projetos depois** na mesma VPS → premissa "uma VPS = um projeto" caiu.
- Estado herdado: hostname `talkingpres-prod`, user `deploy`, Coolify via template (4 containers), hardening aplicado. Cloudflare/DNS e R2 **nunca executados** — o campo `<SEU_DOMINIO>` jamais foi preenchido, logo não existe zona `talkingpres.com` real em produção a migrar.
- Footprint real de `talkingpres` na máquina é pequeno: hostname e o arquivo `/etc/apt/apt.conf.d/52talkingpres-unattended-upgrades`. O resto (`deploy`, ufw, fail2ban) já é agnóstico.
- Restrição da sessão: a chave `~/.ssh/talkingpres_ed25519` tem passphrase; ssh-agent vazio; sem CLI `bw`. Acesso on-box depende de o operador carregar a chave.

## Execução — artefatos locais (concluído)

Feito sem tocar na máquina, fora do repo:

```bash
# Chave SSH: namespace agnóstico (mesmo par, já autorizado na VPS)
cp -p ~/.ssh/talkingpres_ed25519     ~/.ssh/panini_vps_ed25519
cp -p ~/.ssh/talkingpres_ed25519.pub ~/.ssh/panini_vps_ed25519.pub
# (a antiga fica como backup até a nova ser validada)

# ~/.ssh/config — alias de conveniência
cat > ~/.ssh/config <<'EOF'
Host panini-vps
  HostName <SEU_IP_VPS>
  User deploy
  IdentityFile ~/.ssh/panini_vps_ed25519
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

# Caderno de bootstrap renomeado e atualizado
#   ~/secrets/talkingpres-bootstrap.md → ~/secrets/panini-vps-bootstrap.md
```

Verificação: `ssh-keygen -lf ~/.ssh/panini_vps_ed25519.pub` devolve o mesmo fingerprint `SHA256:u3kxbG8GjkJiEcxLLss3LzeaCaNt33FNB28ndHYLOFE` (par idêntico, sem re-keying). `ssh -G panini-vps` resolve para `<SEU_IP_VPS> / deploy / panini_vps_ed25519`.

## Execução — documentação do repo (concluído)

- **ADR-0016** criado registrando a decisão de VPS agnóstica multi-projeto; ADR-0003 e ADR-0006 ganharam linha de "complementado por ADR-0016" (sem reescrever o corpo, conforme convenção do índice de ADRs).
- **Runbook 0001** (operação da VPS) reescrito para nomenclatura `panini-vps`.
- **Guides 0001/0002** generalizados: exemplos passam de `talkingpres-*` para `panini-vps`.
- **ai-ops 0001/0002** preservados como registro histórico, com banner de forward-pointer para este documento.
- **ROADMAP** marca a tarefa de generalização da VPS.

## Execução — on-box (concluído nesta sessão, ao vivo)

O operador carregou a chave no agent (`ssh-add ~/.ssh/panini_vps_ed25519`) e o agente conectou via `panini-vps`. Auditoria primeiro: o footprint real de `talkingpres` na máquina era **apenas dois itens** — `/etc/hostname` e `/etc/apt/apt.conf.d/52talkingpres-unattended-upgrades`. Sem projetos/containers Coolify com nome de projeto (só os 4 containers padrão `coolify*`), sem arquivos `*talkingpres*` em `/etc /home /opt /root`, `authorized_keys` do `deploy` com comentários agnósticos (`panini.development@gmail.com` + `coolify`). Nada aqui mexe em `sshd`, `ufw` ou sudoers — risco baixo.

```bash
# 1. Hostname
sudo hostnamectl set-hostname panini-vps      # talkingpres-prod → panini-vps

# 2. Override de unattended-upgrades (preserva conteúdo)
sudo mv /etc/apt/apt.conf.d/52talkingpres-unattended-upgrades \
        /etc/apt/apt.conf.d/52panini-vps-unattended-upgrades

# 3. Comentário interno do arquivo também referenciava o projeto
sudo sed -i 's#// talkingpres hardening:#// panini-vps hardening:#' \
        /etc/apt/apt.conf.d/52panini-vps-unattended-upgrades
```

**Saídas reais (verificação):**

```text
$ hostnamectl            → Static hostname: panini-vps
$ cat /etc/hostname      → panini-vps
$ hostname -f            → panini-vps        (resolve, sem warning de sudo)
$ ls /etc/apt/apt.conf.d/ | grep unattended
    50unattended-upgrades
    52panini-vps-unattended-upgrades
$ sudo grep -rni talkingpres /etc   → VAZIO (nenhuma referência)
$ sudo find /etc /home /opt /root -iname '*talkingpres*'   → nenhum
$ sudo unattended-upgrades --dry-run --debug
    Allowed origins are: o=Ubuntu,a=noble-security, o=UbuntuESMApps,a=noble-apps-security, o=UbuntuESM,a=noble-infra-security
```

Reaplicar o `mv` falha com "No such file or directory" (origem já não existe) — operação idempotente.

## Obstáculos e resoluções

- **Passphrase indisponível.** A única chave autorizada exige passphrase; sem `bw` para recuperá-la. Resolução: trabalho local + repo feito autonomamente; renomeação on-box aplicada ao vivo após o operador carregar a chave no agent.
- **Sem zona DNS real a migrar.** Diferente do que ADR-0003/0006 sugeriam, `talkingpres.com` nunca foi para a Cloudflare. Logo a generalização não exigiu mexer em DNS — só na nomenclatura local e on-box. As N zonas (uma por projeto) entram quando a borda Cloudflare for de fato executada (guide 0002).
- **Referência escondida no conteúdo do arquivo.** Renomear `52talkingpres-unattended-upgrades` não bastou: a primeira linha era `// talkingpres hardening: ...`. Sem corrigir, `grep -rni talkingpres /etc` ainda casava. Resolução: `sed` no comentário interno. Lição: ao "remover referências", varrer **conteúdo**, não só nomes de arquivo.
- **`/etc/hosts` gerido por cloud-init.** As linhas `127.0.1.1` ainda apontam para nomes de fábrica (`srv1700377.hstgr.cloud`, `ubuntu-24-coolify`) — drift pré-existente, **não** continha `talkingpres`. Como `manage_etc_hosts: True` faz cloud-init regerar o arquivo, e `sudo`/`hostname -f` já resolvem `panini-vps` sem warning, deixamos `/etc/hosts` intocado nesta sessão. Anotado como dívida de limpeza cosmética.

## Dívidas

- Migrar itens do gerenciador de segredos de `talkingpres/` para `panini-vps/` (`ssh-passphrase`, `coolify-admin`, tokens) — manual, sem CLI na sessão.
- Remover a chave antiga `~/.ssh/talkingpres_ed25519{,.pub}` após validar a nova em uso real.
- Quando o primeiro projeto for de fato deployado, criar o *Coolify Project* dedicado e a zona Cloudflare correspondente (ADR-0016, eixos de isolamento).
