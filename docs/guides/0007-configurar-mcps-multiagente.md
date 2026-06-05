---
title: Configurar MCPs de infraestrutura no Claude Code, Codex e Copilot
description: Padroniza Hostinger, Coolify e Cloudflare nos três agentes locais, com configs gitignored, versões pinadas e OAuth separado por cliente.
nav_title: MCPs multiagente
---

Este guide consolida os MCPs de infraestrutura do epistemix nos três agentes usados no VS Code: Claude Code, OpenAI Codex e GitHub Copilot Chat local. Os guides [0004](0004-configurar-hostinger-vps-mcp.md), [0005](0005-configurar-coolify-mcp.md) e [0006](0006-configurar-cloudflare-mcp.md) continuam sendo a referência de cada provedor; aqui fica a configuração cross-harness.

O desenho deliberadamente **não** configura o Copilot cloud/coding agent. Esse agente usa ferramentas autonomamente, não compartilha o `.env` local e não suporta MCP remoto autenticado por OAuth. Credenciais de produção ficam restritas aos agentes locais com confirmação de tool call.

## Example

Estado esperado:

| Cliente local | Config real | Template versionado |
|---|---|---|
| Claude Code | `.mcp.json` | `.mcp.json.example` |
| Codex CLI/IDE | `.codex/config.toml` | `.codex/config.toml.example` |
| Copilot Chat no VS Code | `.vscode/mcp.json` | `.vscode/mcp.json.example` |

Todos usam:

- `.env` para `HOSTINGER_API_TOKEN`, lido diretamente pelo MCP oficial via dotenv;
- `COOLIFY_ACCESS_TOKEN` inline somente nos três configs reais e gitignored, porque o MCP comunitário não lê `.env`;
- `hostinger-api-mcp@0.2.5` e `@masonator/coolify-mcp@2.12.0` pinados;
- `https://mcp.cloudflare.com/mcp` com OAuth independente por cliente.

Esta assimetria é deliberadamente temporária: evita um runner próprio enquanto os três clientes não compartilham uma integração portável com gerenciador de segredos. O custo aceito é duplicar o token Coolify em três arquivos locais.

### Passo 1: Preparar o token Hostinger

Copie `.env.example` para `.env` e preencha:

```text
HOSTINGER_API_TOKEN=<segredo>
```

Não use aliases. O `hostinger-api-mcp` carrega o `.env` do diretório do projeto via dotenv; não é necessário executar `source .env` nem repetir o token nos configs MCP.

### Passo 2: Materializar as três configurações locais

```bash
cp .mcp.json.example .mcp.json
cp .codex/config.toml.example .codex/config.toml
cp .vscode/mcp.json.example .vscode/mcp.json
```

Os três destinos são gitignored. Os templates são versionados e não contêm segredos.

Gere ou recupere um token em **Coolify -> Settings -> API / Keys & Tokens**. Comece read-only. Em cada config real, substitua `<COLE_O_TOKEN_DO_COOLIFY>` pelo mesmo valor:

| Config real | Campo |
|---|---|
| `.mcp.json` | `mcpServers.coolify.env.COOLIFY_ACCESS_TOKEN` |
| `.codex/config.toml` | `mcp_servers.coolify.env.COOLIFY_ACCESS_TOKEN` |
| `.vscode/mcp.json` | `servers.coolify.env.COOLIFY_ACCESS_TOKEN` |

Não coloque o token nos templates, no `.env` ou em comando de shell. Confirme que os configs reais continuam ignorados:

```bash
git check-ignore .mcp.json .codex/config.toml .vscode/mcp.json
```

No Codex, o projeto precisa estar confiável para carregar `.codex/config.toml`. A configuração vale para CLI e extensão IDE. No Copilot, `.vscode/mcp.json` executa no ambiente remoto do workspace WSL e disponibiliza as ferramentas no modo Agent.

### Passo 3: Autenticar Cloudflare e validar em leitura

OAuth da Cloudflare não é compartilhado entre clientes:

1. Claude Code: abra `/mcp`, conecte `cloudflare` e autorize os scopes mínimos.
2. Codex: execute `codex mcp login cloudflare` e conclua o fluxo no browser.
3. Copilot/VS Code: abra `.vscode/mcp.json`, inicie `cloudflare` e conclua o prompt de autenticação.

Valide os clientes:

```bash
claude mcp list
codex mcp list
```

No VS Code, abra `.vscode/mcp.json` e inicie os três servers. Depois, em cada agente, faça somente leitura:

```text
Liste a VPS Hostinger, os projetos/servidores do Coolify e as zonas Cloudflare.
Retorne apenas identificadores, nomes e status. Não altere nada.
```

### Upgrade opcional: direnv (single-source, sem duplicar o token)

A duplicação do token Coolify nos três configs desaparece se o `.env` for carregado automaticamente no shell — aí cada cliente lê `COOLIFY_ACCESS_TOKEN` do ambiente em vez de inline. O [direnv](https://direnv.net) faz isso por diretório, sem `source` manual por sessão.

Setup único (por máquina):

1. Instale o direnv e adicione o hook ao shell (ex.: `eval "$(direnv hook zsh)"` no `~/.zshrc`).
2. Crie um `.envrc` na raiz (sem segredo — só a diretiva) e autorize:

   ```bash
   echo 'dotenv' > .envrc && direnv allow
   ```

3. Mova o token Coolify do config para o `.env` e troque o inline por referência ao ambiente:
   - `.mcp.json`: `"COOLIFY_ACCESS_TOKEN": "${COOLIFY_ACCESS_TOKEN}"`
   - `.codex/config.toml`: troque o bloco `env` por `env_vars = ["COOLIFY_ACCESS_TOKEN"]`
   - `.vscode/mcp.json`: `"COOLIFY_ACCESS_TOKEN": "${env:COOLIFY_ACCESS_TOKEN}"`

Resultado: token só no `.env` (gitignored), zero duplicação. Custo: depender do direnv instalado em cada máquina — por isso é upgrade, não o padrão.

## Critério de sucesso

- Os três templates versionados não contêm tokens.
- Os três configs reais estão ignorados pelo Git e não contêm `<COLE_O_TOKEN_DO_COOLIFY>`.
- Hostinger conecta nos três clientes lendo `HOSTINGER_API_TOKEN` do `.env`.
- Coolify conecta nos três clientes recebendo `COOLIFY_ACCESS_TOKEN` somente do config real correspondente.
- Codex lista `hostinger-vps`, `coolify` e `cloudflare`.
- Copilot Chat local mostra os três servidores no seletor de ferramentas.
- Cada cliente conclui seu próprio OAuth Cloudflare.
- Nenhuma configuração MCP é adicionada ao Copilot cloud/coding agent.

## Next steps

- Usar os MCPs apenas conforme o semáforo operacional do [ADR-0017](../adr/0017-desenvolvimento-autonomo-afk.md).
- Configurar backup Postgres em R2 somente depois de existir o PostgreSQL dedicado do epistemix.

## References

- [OpenAI Codex — Model Context Protocol](https://developers.openai.com/codex/mcp)
- [VS Code — Use MCP servers](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
- [GitHub — Extend Copilot coding agent with MCP](https://docs.github.com/copilot/customizing-copilot/using-model-context-protocol/extending-copilot-coding-agent-with-mcp)
- [Cloudflare — Cloudflare MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/)
