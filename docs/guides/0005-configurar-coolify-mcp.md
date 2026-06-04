---
title: Configurar o Coolify MCP local para operar deploys na VPS
description: Instala o MCP server da comunidade @masonator/coolify-mcp, conecta-o a um cliente MCP local (Claude Code) com config sem segredo (token via .env exportado), aponta para o painel Coolify proxied e valida com operações read-only sobre projetos/aplicações antes de liberar qualquer escrita (deploy, restart, stop).
nav_title: Coolify MCP
---

Este guide conecta um agente de IA ao painel Coolify da VPS via API, expondo as operações de PaaS (projetos, aplicações, deploys, bancos, serviços) como ferramentas tipadas. O objetivo é operação de deploy assistida com a mesma disciplina de borda do [guide 0004](0004-configurar-hostinger-vps-mcp.md): leitura primeiro, escrita só com plano e confirmação.

Diferente da Hostinger e da Cloudflare, **não há MCP oficial da Coolify**. Usamos o server da comunidade mais maduro, `@masonator/coolify-mcp` — 42 ferramentas *token-optimized*. Isso importa: a API do Coolify é muito verbosa (uma única aplicação traz ~91 campos; listar 20+ apps passa de 200KB e estoura o context window). O server resume por padrão e adiciona busca por domínio/IP em vez de só UUID.

> ⚠️ **Server de terceiro, não oficial.** Um MCP da comunidade vê seus tokens e pode ser vetor de prompt injection (ver [aviso do Claude Code sobre MCP](https://code.claude.com/docs/en/mcp)). Fixe a versão, leia o que ele faz e mantenha a regra read-first. Trate-o como o que é: conveniência operacional, não infra de confiança.

O escopo **não** inclui executar deploys/destruições. O guide deixa o MCP pronto e provado em modo leitura; qualquer ação de escrita (deploy, restart, stop, delete) fica atrás de confirmação explícita do operador.

## Example

Como exemplo, vamos registrar o `coolify` no Claude Code como server de escopo de projeto (config sem token, gitignored), apontar o token via `.env` exportado e provar conectividade listando projetos/servidores em modo read-only contra o painel proxied em `https://vps.thiagopanini.dev`.

Pré-condições:

- **Node.js 20+** no ambiente local (o pacote declara `engines.node >= 20`). Verifique com `node -v`.
- **Cliente MCP local** com suporte a stdio (Claude Code, Cursor ou equivalente).
- **Painel Coolify já no ar** e acessível pelo domínio público (proxied na Cloudflare — ver [ADR-0006](../adr/0006-cloudflare-na-frente-da-vps.md)).
- Placeholders: `<COOLIFY_ACCESS_TOKEN>` (gerado no painel), `<COOLIFY_BASE_URL>` (= `https://vps.thiagopanini.dev`).

### Passo 1: Gerar o token (read-only primeiro) e colocá-lo no `.env`

Gere um token em **Coolify -> Settings -> API / Keys & Tokens**. O Coolify deixa escolher permissões — **comece com um token read-only** para provar conectividade sem risco; só escale para escrita depois que a leitura estiver verde.

```bash
cp .env.example .env   # se ainda não existir
# edite .env e preencha:
# COOLIFY_ACCESS_TOKEN=<COOLIFY_ACCESS_TOKEN>
```

> ⚠️ **Fricção comum: este server NÃO lê `.env` sozinho.** O `@masonator/coolify-mcp` lê do **env do processo** (`COOLIFY_ACCESS_TOKEN`) — confirmado: o pacote não declara `dotenv` nas deps, diferente do MCP da Hostinger. Como entregar o token depende de **como o Claude Code é lançado**:
>
> - **CLI (terminal):** exporte o `.env` antes de subir:
>   ```bash
>   set -a; source .env; set +a   # exporta tudo do .env para o ambiente
>   claude
>   ```
> - **VS Code (extensão):** o Claude Code não herda um shell com `source .env`. Cole o token direto no **`env` do `.mcp.json`** (que é gitignored — mesma proteção do `.env`), trocando o placeholder `${COOLIFY_ACCESS_TOKEN:-}` pelo valor. É uma exceção consciente ao "config sem segredo", válida porque o arquivo não é versionado e o server não lê `.env`.

Proof: `grep -c '^COOLIFY_ACCESS_TOKEN=' .env` retorna `1`; e, após o `source`, `printenv COOLIFY_ACCESS_TOKEN` mostra o valor.

### Passo 2: Registrar o server no cliente (config sem segredo)

Registre o server apontando para o painel proxied. O token **não** vai literal na config — usamos expansão `${VAR}` do Claude Code, com default vazio para não derrubar o `.mcp.json` inteiro caso a var não esteja exportada ainda.

```bash
# Claude Code (escopo de projeto -> grava ./.mcp.json):
claude mcp add coolify -s project \
  --env COOLIFY_BASE_URL=https://vps.thiagopanini.dev \
  --env 'COOLIFY_ACCESS_TOKEN=${COOLIFY_ACCESS_TOKEN:-}' \
  -- npx -y @masonator/coolify-mcp
```

O resultado no `.mcp.json` (token-free):

```json
{
  "mcpServers": {
    "coolify": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@masonator/coolify-mcp"],
      "env": {
        "COOLIFY_BASE_URL": "https://vps.thiagopanini.dev",
        "COOLIFY_ACCESS_TOKEN": "${COOLIFY_ACCESS_TOKEN:-}"
      }
    }
  }
}
```

> 💡 **Por que `:-` (default vazio).** Se uma var sem default não estiver setada, o Claude Code **falha ao parsear o `.mcp.json` inteiro** — derrubaria também `hostinger-vps` e `cloudflare`. Com `${COOLIFY_ACCESS_TOKEN:-}`, só o server `coolify` falha auth até você exportar o token; os outros seguem vivos.

> ⚠️ **Convenção do repo: `.mcp.json` fora do git.** Mesmo sem segredo dentro, o arquivo referencia infra pessoal e está no `.gitignore` (mesma regra dos guides [0002](0002-configurar-cloudflare-r2-mcp.md) e [0004](0004-configurar-hostinger-vps-mcp.md)). Confirme: `git check-ignore .mcp.json` imprime `.mcp.json`.

Proof: `claude mcp get coolify` mostra `Scope: Project config` e `Type: stdio`.

### Passo 3: Validar conectividade e listar projetos (read-only)

Suba o Claude Code **com o token exportado** (Passo 1) e confirme que o server conecta:

```bash
set -a; source .env; set +a
claude mcp list
# esperado: coolify: npx -y @masonator/coolify-mcp - ✓ Connected
```

Depois, prove uma operação real e segura pedindo ao agente:

```text
Use o MCP coolify para um overview read-only: versão do Coolify, lista de
servidores e de projetos (só nome/uuid/status). Não dispare deploy nem altere nada.
```

Esperado: a versão do painel, o servidor e os projetos existentes aparecem. Anote os UUIDs de projeto/aplicação para chamadas de detalhe e diagnóstico.

> ⚠️ **Coolify atrás do Cloudflare.** `COOLIFY_BASE_URL` é o domínio **público** proxied (`https://vps.thiagopanini.dev`), nunca `localhost:8000`. Se um dia você colocar **Cloudflare Access** na frente do painel, este server aceita `CF-Access-Client-Id` / `CF-Access-Client-Secret` via `--env`.

#### Regra operacional para qualquer escrita

As 42 ferramentas incluem ações de impacto real (deploy, restart, stop, delete de app/serviço/banco, e um *emergency stop all*). Antes de executar qualquer uma:

```text
Antes de executar, mostre a ferramenta, o método/endpoint, o payload, o
recurso-alvo (uuid + nome) e o efeito esperado. Aguarde minha confirmação.
```

Só confirme se o alvo for o recurso certo, sem deploy/stop/delete acidental. O *emergency stop all* já exige confirmação no próprio server. Mantenha o UI do Coolify como rede de segurança ao mexer em produção.

## Critério de sucesso

Considere este guide concluído apenas se todos os checks passarem:

- `node -v` ≥ 20 e `npx -y @masonator/coolify-mcp` sobe sem erro de pacote.
- `.env` tem `COOLIFY_ACCESS_TOKEN` preenchido e está no `.gitignore`; `printenv COOLIFY_ACCESS_TOKEN` mostra o valor após `source`.
- `.mcp.json` existe, usa `${COOLIFY_ACCESS_TOKEN:-}` (sem segredo) e `git check-ignore .mcp.json` confirma que está ignorado.
- `claude mcp list` mostra `coolify - ✓ Connected`.
- O overview read-only retorna versão + servidores + projetos esperados (`isError: false`).
- Nenhum deploy/stop/delete foi executado sem plano + confirmação.

## Next steps

- [Guide 0006 — Configurar o Cloudflare MCP remoto](0006-configurar-cloudflare-mcp.md): fecha o tripé de bordas (VPS + PaaS + edge).
- [Runbook 0001 — Operação da VPS](../runbooks/0001-operacao-vps.md): saúde da VPS e Coolify no dia a dia.
- [ADR-0003 — Infra Hostinger VPS + Coolify](../adr/0003-infra-hostinger-vps-coolify.md): contexto da decisão de hosting/PaaS.

## References

- [GitHub — StuMason/coolify-mcp](https://github.com/StuMason/coolify-mcp)
- [npm — @masonator/coolify-mcp](https://www.npmjs.com/package/@masonator/coolify-mcp)
- [Coolify — API & Keys/Tokens (docs)](https://coolify.io/docs/api-reference/authorization)
- [Anthropic — Configurar MCP no Claude Code](https://code.claude.com/docs/en/mcp)
- [Model Context Protocol — especificação](https://modelcontextprotocol.io/)
