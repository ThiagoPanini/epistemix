---
title: Configurar o Cloudflare MCP remoto para gerenciar DNS e edge
description: Conecta o Claude Code ao MCP server remoto oficial da Cloudflare (mcp.cloudflare.com) via transporte HTTP + OAuth, sem segredo em arquivo, e valida com operações read-only sobre zonas/DNS antes de liberar qualquer escrita. Documenta também o caminho headless por Bearer token escopado.
nav_title: Cloudflare MCP
---

Este guide conecta um agente de IA ao plano de controle da Cloudflare — DNS, zonas, WAF, cache, regras — via **MCP server remoto oficial**, mantido pela própria Cloudflare. Fecha o tripé de bordas do epistemix junto com [Hostinger (VPS)](0004-configurar-hostinger-vps-mcp.md) e [Coolify (PaaS)](0005-configurar-coolify-mcp.md).

A diferença estrutural vs. os outros dois: aqui **não há server stdio local nem token em `.env`**. A Cloudflare hospeda os servers; o cliente fala HTTP e autentica por **OAuth** (uma autorização no browser, depois renova sozinho). Disciplina de borda igual: a Cloudflare está **na frente da produção** ([ADR-0006](../adr/0006-cloudflare-na-frente-da-vps.md)), então leitura primeiro, escrita só com plano e confirmação.

> 💡 **Qual server, de 17.** A Cloudflare mantém uma frota de MCP servers remotos especializados. Para *gerência de configuração* (registros DNS, settings de zona, regras de WAF/firewall, cache), o relevante é o **Cloudflare API server** (`https://mcp.cloudflare.com/mcp`), que cobre 2.500+ endpoints de todos os produtos. O `dns-analytics.mcp.cloudflare.com` é só **analytics** (read-only de performance), não gerência.

## Example

Como exemplo, vamos registrar o `cloudflare` no Claude Code via HTTP, autenticar por OAuth com `/mcp`, e provar conectividade listando zonas/registros DNS em modo read-only.

Pré-condições:

- **Claude Code** (suporte nativo a transporte HTTP + OAuth para MCP remoto).
- **Conta Cloudflare** com a zona já delegada (NS apontando para a Cloudflare — feito no [guide 0002](0002-configurar-cloudflare-r2-mcp.md)).
- Browser disponível na primeira autenticação OAuth.

### Passo 1: Registrar o server remoto (HTTP, sem segredo)

Não há instalação de pacote — só apontar o cliente para a URL remota. Use escopo de projeto para manter os três servers juntos no `.mcp.json`:

```bash
# Claude Code (escopo de projeto -> grava ./.mcp.json):
claude mcp add --transport http cloudflare -s project https://mcp.cloudflare.com/mcp
```

O resultado no `.mcp.json` (nenhum segredo — OAuth fica no keychain do SO):

```json
{
  "mcpServers": {
    "cloudflare": {
      "type": "http",
      "url": "https://mcp.cloudflare.com/mcp"
    }
  }
}
```

Proof: `claude mcp get cloudflare` mostra `Type: http` e a URL remota.

### Passo 2: Autenticar via OAuth

A primeira chamada responde `401`, o que sinaliza o server como "precisa de auth" no painel `/mcp`. Dentro do Claude Code:

```text
/mcp
```

Siga o fluxo no browser: você loga na Cloudflare e **seleciona as permissões/scopes** a conceder. Os tokens ficam guardados com segurança e **renovam automaticamente** — depois dessa autorização única, o uso é autônomo.

> 💡 **Menor privilégio.** Conceda só os scopes necessários no consentimento OAuth. Para travar isso na config, fixe `oauth.scopes` no `.mcp.json` do server (string separada por espaço). Comece estreito (leitura de zona/DNS) e amplie sob demanda.

Proof: após o fluxo, `/mcp` mostra `cloudflare` como conectado, com a contagem de tools ao lado.

### Passo 3: Validar com leitura de zona/DNS (read-only)

Prove uma operação real e segura:

```text
Use o MCP cloudflare para listar minhas zonas (read-only) e, para a zona
epistemix.dev, os registros DNS (tipo, nome, conteúdo, proxied). Não altere nada.
```

Esperado: as zonas `epistemix.dev` / `thiagopanini.dev` aparecem, com os registros e o flag *proxied* (laranja) coerentes com o [guide 0003](0003-publicar-epistemix-dev-em-producao.md).

> 💡 **Alternativa headless (sem browser).** Para automação sem interação OAuth, gere um **API token escopado** em `dash.cloudflare.com -> My Profile -> API Tokens` e passe como Bearer. Mantém o segredo no `.env` (exportado), não em arquivo versionável:
>
> ```bash
> claude mcp add --transport http cloudflare -s project https://mcp.cloudflare.com/mcp \
>   --header 'Authorization: Bearer ${CLOUDFLARE_API_TOKEN}'
> ```
>
> Trade-off: OAuth dá o seletor de permissões interativo + refresh automático; o Bearer você escopa no dashboard e dispensa browser — melhor para autonomia total. Escolha **um** caminho (se houver `Authorization` configurado e o token for rejeitado, o Claude Code reporta falha em vez de cair no OAuth).

#### Regra operacional para qualquer escrita

O API server cobre escrita de alto raio de impacto: mudar um registro DNS, desligar o proxy ou alterar SSL mode pode tirar `epistemix.dev` do ar. Antes de qualquer escrita:

```text
Antes de executar, mostre a ferramenta, o endpoint, o payload, a zona/registro
alvo e o efeito esperado (incl. impacto em proxy/SSL). Aguarde minha confirmação.
```

Só confirme se a zona e o registro forem os certos. Mantenha o dashboard da Cloudflare como rede de segurança.

## Critério de sucesso

Considere este guide concluído apenas se todos os checks passarem:

- `.mcp.json` tem o server `cloudflare` com `type: http` e a URL remota; sem segredo no arquivo (caminho OAuth).
- `git check-ignore .mcp.json` confirma que está ignorado.
- `/mcp` mostra `cloudflare` conectado após o fluxo OAuth (ou via Bearer no caminho headless).
- A listagem read-only retorna as zonas e registros DNS esperados (`isError: false`).
- Nenhuma escrita em DNS/zona/proxy foi executada sem plano + confirmação.

## Next steps

- [Runbook 0001 — Operação da VPS](../runbooks/0001-operacao-vps.md): operação diária agora também consultável via os três MCPs (VPS + Coolify + Cloudflare).
- [ADR-0006 — Cloudflare na frente da VPS](../adr/0006-cloudflare-na-frente-da-vps.md): contexto da borda de edge.
- Guia futuro: automações de DNS/cache via MCP, só depois de provar o ciclo read-only no uso real.

## References

- [Cloudflare — Cloudflare's own MCP servers (docs)](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/)
- [Cloudflare — Thirteen new MCP servers (blog)](https://blog.cloudflare.com/thirteen-new-mcp-servers-from-cloudflare/)
- [GitHub — cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare)
- [Anthropic — Configurar MCP remoto + OAuth no Claude Code](https://code.claude.com/docs/en/mcp)
- [Model Context Protocol — especificação](https://modelcontextprotocol.io/)
