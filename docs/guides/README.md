# Guides

Guias técnicos para reproduzir etapas que fazem parte da trilha criativa real do epistemix. Eles não são backlog genérico: entram aqui apenas procedimentos que já foram executados e destilados em receita, ou o próximo passo imediato necessário para continuar a mesma sequência operacional.

Para entender os conceitos por trás das técnicas usadas, veja [docs/lessons/](../lessons/). Para o registro do que a IA + operador efetivamente fizeram em operações reais, veja [docs/ai-ops/](../ai-ops/). Para comandos cotidianos de operação, veja [docs/runbooks/](../runbooks/).

## Formato

Cada guide deve manter:

- YAML frontmatter (`title`, `description`, `nav_title`)
- Introdução curta com escopo explícito
- Seção `## Example` com pré-condições e placeholders
- 2-4 passos progressivos (`### Passo N: ...`) com comando mínimo, fricção comum, resolução e proof observável
- Seção `## Next steps` linkando o próximo passo lógico, sem antecipar guides ainda não executáveis

## Como criar um novo guide

1. Copie o guide mais recente como template.
2. Numere sequencialmente: `NNNN-titulo-em-kebab.md`.
3. Resolva **uma** etapa operacional. Se o outline tem 5+ passos, divida em dois guides.
4. Linke daqui na lista abaixo.
5. Se a etapa ainda não aconteceu ou depende de recurso inexistente, registre como `Next steps` em vez de criar guide prematuro.

## Lista

- [0001 — Criar VPS Hostinger com Coolify e hardening base](0001-criar-vps-hostinger-com-coolify.md)
- [0002 — Criar conta Cloudflare e preparar DNS, R2 e MCP](0002-configurar-cloudflare-r2-mcp.md)
- [0003 — Publicar epistemix.dev em produção (Cloudflare + Coolify)](0003-publicar-epistemix-dev-em-producao.md)
- [0004 — Configurar o Hostinger MCP local para gerenciar a VPS](0004-configurar-hostinger-vps-mcp.md)
- [0005 — Configurar o Coolify MCP local para operar deploys na VPS](0005-configurar-coolify-mcp.md)
- [0006 — Configurar o Cloudflare MCP remoto para gerenciar DNS e edge](0006-configurar-cloudflare-mcp.md)

## Aguardando execução

- Backup Postgres em R2: próximo guide provável, mas só depois da conta Cloudflare, zona DNS e bucket R2 existirem.
