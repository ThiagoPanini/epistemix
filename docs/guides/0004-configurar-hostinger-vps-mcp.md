---
title: Configurar o Hostinger MCP local para gerenciar a VPS
description: Instala o MCP server oficial da Hostinger (hostinger-vps-mcp), conecta-o a um cliente MCP local (Claude Code) com config sem segredo, lê o token do .env via dotenv e valida com operações read-only sobre a VPS antes de liberar qualquer escrita.
nav_title: Hostinger VPS MCP
---

Este guide conecta um agente de IA à VPS Hostinger via API oficial, usando o **MCP server mantido pela própria Hostinger**. O objetivo é gerência operacional assistida (listar, status, métricas, backups, firewall) com a mesma disciplina de borda do [guide 0002](0002-configurar-cloudflare-r2-mcp.md): leitura primeiro, escrita só com plano e confirmação.

O escopo **não** inclui criar/recriar/desligar recursos. O guide deixa o MCP pronto e provado em modo leitura; qualquer ação destrutiva (delete, recreate, stop/restart, reinstall OS) fica atrás de confirmação explícita do operador.

> 💡 **Por que o MCP oficial e não um script próprio.** A Hostinger publica e mantém [`hostinger/api-mcp-server`](https://github.com/hostinger/api-mcp-server) (npm `hostinger-api-mcp`), gerado a partir do OpenAPI oficial. Expõe a API VPS como ferramentas tipadas (62 no server VPS), com auth por Bearer e User-Agent próprio que passa pelo WAF da Hostinger. Um script `urllib`/`curl` caseiro toma `1010 — banned UA` no Cloudflare da Hostinger (ver fricção no Passo 3).

## Example

Como exemplo, vamos instalar o `hostinger-vps-mcp`, registrá-lo no Claude Code como server de escopo de projeto (config sem token, versionada fora do repo), apontar o token via `.env` e provar conectividade listando a VPS existente em modo read-only.

Pré-condições:

- **Node.js 20+** no ambiente local (o pacote declara `engines.node >= 20`). Verifique com `node -v`.
- **Cliente MCP local** com suporte a stdio (Claude Code, Cursor ou equivalente).
- **VPS Hostinger já existente** e acesso ao hPanel para gerar o token.
- Placeholders: `<HOSTINGER_API_TOKEN>` (gerado no hPanel), `<VM_ID>` (id numérico da VPS, descoberto na validação).

### Passo 1: Gerar o token e colocá-lo no `.env`

Gere um token em **hPanel -> Conta -> API** (`https://hpanel.hostinger.com/profile/api`). Ele vai no header `Authorization: Bearer` de toda chamada e dá acesso de gerência à conta — trate como segredo.

O MCP carrega `.env` automaticamente (depende de `dotenv`) a partir do diretório onde é lançado. O nome **canônico** que ele lê é `HOSTINGER_API_TOKEN` (aliases aceitos: `API_TOKEN`, `APITOKEN`):

```bash
cp .env.example .env   # se ainda não existir
# edite .env e preencha:
# HOSTINGER_API_TOKEN=<HOSTINGER_API_TOKEN>
```

> ⚠️ **Fricção comum: nome da variável.** Se o token estiver em `.env` sob outro nome (ex.: `HOSTINGER_API_KEY`), o server **não** o reconhece e cai no fluxo OAuth (abre browser). Use exatamente `HOSTINGER_API_TOKEN`. O `.env` está no `.gitignore`; nunca versione o token.

Proof: `grep -c '^HOSTINGER_API_TOKEN=' .env` retorna `1`.

### Passo 2: Instalar o server e registrar no cliente (config sem segredo)

Instale o pacote oficial e registre o server VPS no cliente. A config fica **sem token** — o segredo vive só no `.env`, lido por `dotenv` em runtime.

```bash
npm install -g hostinger-api-mcp        # ou rode direto via: npx -y hostinger-vps-mcp

# Claude Code (escopo de projeto -> grava ./.mcp.json):
claude mcp add hostinger-vps -s project -- npx -y hostinger-vps-mcp
```

Isso gera um `.mcp.json` token-free:

```json
{
  "mcpServers": {
    "hostinger-vps": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "hostinger-vps-mcp"],
      "env": {}
    }
  }
}
```

> ⚠️ **Convenção do repo: `.mcp.json` fora do git.** Como o arquivo referencia infra pessoal, ele está no `.gitignore` (mesma regra do [guide 0002](0002-configurar-cloudflare-r2-mcp.md)). Mesmo sem segredo dentro, não versione. Confirme: `git check-ignore .mcp.json` deve imprimir `.mcp.json`.

> 💡 **Server VPS vs unificado.** `hostinger-vps-mcp` expõe só as 62 ferramentas de VPS — superfície enxuta e on-mission. Se quiser também DNS, domínios, hosting e billing num server só, troque o comando por `hostinger-api-mcp` (121 ferramentas). Para esta infra, DNS já vive na Cloudflare, então o server VPS basta.

Proof: `claude mcp get hostinger-vps` mostra `Scope: Project config` e `Type: stdio`.

### Passo 3: Validar conectividade e listar a VPS (read-only)

Primeiro, o cliente precisa conectar de fato (sobe o server, faz `initialize`, lê o token do `.env`):

```bash
claude mcp list
# esperado: hostinger-vps: npx -y hostinger-vps-mcp - ✓ Connected
```

Depois, prove uma operação real e segura pedindo ao agente a listagem das VPS:

```text
Use o MCP hostinger-vps para chamar VPS_getVirtualMachinesV1 (read-only).
Retorne só id, state, plan e template. Não altere nada.
```

Esperado: a VPS aparece com `state: running`, plano e template corretos. Anote o `<VM_ID>` para chamadas de detalhe/métrica (`VPS_getVirtualMachineDetailsV1`, `VPS_getMetricsV1`).

> ⚠️ **Fricção comum: WAF 1010.** O Cloudflare na frente da API da Hostinger bane User-Agents de biblioteca padrão (`python-urllib`, etc.) com erro `1010`. O MCP oficial envia `hostinger-mcp-server/<versão>` e passa. Se você scriptar a API à mão, defina um UA de browser (há precedente em `.local/hostinger-firewall.py`).

#### Regra operacional para qualquer escrita

As 62 ferramentas incluem ações destrutivas (`VPS_deleteProjectV1`, `VPS_recreateVirtualMachineV1`, `VPS_restartVirtualMachineV1`, ...). Antes de executar qualquer uma:

```text
Antes de executar, mostre a ferramenta, o método/endpoint, o payload, o
recurso-alvo (VM id) e o efeito esperado. Aguarde minha confirmação.
```

Só confirme se o alvo for a VM certa, sem delete/stop/recreate acidental. Mantenha o Browser Terminal (console) do hPanel como rede de segurança ao mexer em firewall/rede.

## Critério de sucesso

Considere este guide concluído apenas se todos os checks passarem:

- `node -v` ≥ 20 e `npx -y hostinger-vps-mcp` sobe (stderr: `Initialized 62 tools`).
- `.env` tem `HOSTINGER_API_TOKEN` preenchido e está no `.gitignore`.
- `.mcp.json` existe, tem `env: {}` (sem segredo) e `git check-ignore .mcp.json` confirma que está ignorado.
- `claude mcp list` mostra `hostinger-vps - ✓ Connected`.
- `VPS_getVirtualMachinesV1` retorna a VPS esperada em modo read-only (`isError: false`).
- Nenhuma operação de escrita foi executada sem plano + confirmação.

## Next steps

- [Runbook 0001 — Operação da VPS](../runbooks/0001-operacao-vps.md): saúde, firewall, fail2ban e Coolify no dia a dia (agora também consultável via MCP).
- [ADR-0003 — Infra Hostinger VPS + Coolify](../adr/0003-infra-hostinger-vps-coolify.md): contexto da decisão de hosting.
- Guia futuro: automações de backup/snapshot da VPS via MCP, só depois de provar o ciclo read-only no uso real.

## References

- [Hostinger — API MCP Server (suporte oficial)](https://www.hostinger.com/support/11079316-hostinger-api-mcp-server/)
- [Hostinger — How to run your own API MCP server](https://www.hostinger.com/tutorials/how-to-run-hostinger-api-mcp-server)
- [GitHub — hostinger/api-mcp-server](https://github.com/hostinger/api-mcp-server)
- [npm — hostinger-api-mcp](https://www.npmjs.com/package/hostinger-api-mcp)
- [Hostinger — Developers / API reference](https://developers.hostinger.com/)
- [Model Context Protocol — especificação](https://modelcontextprotocol.io/)
- [Anthropic — Configurar MCP no Claude Code](https://docs.anthropic.com/en/docs/claude-code/mcp)
