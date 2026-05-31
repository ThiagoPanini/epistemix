# operate-planning-board — arquivada

Esta skill operava o board de planejamento (GitHub Projects v2) via **GitHub MCP server** (toolset `projects`), conforme o desenho do [ADR-0013 R2](../../../../docs/adr/0013-substrato-de-planejamento-operado-por-agentes.md).

**Obsoleta desde mai/2026.** O [ADR-0014](../../../../docs/adr/0014-roadmap-como-source-skill-solo-dev-assistant.md) substituiu o board ativo por **`docs/ROADMAP.md` como single source de plano + estado** (markers `🚧`/`[x]`, sufixo `@human`/`@agent`), operado pela skill `solo-dev-assistant` (comando `briefing`) + intent-loop no `AGENTS.md` + hook PostToolUse de auto-commit. As issues e o board GitHub Projects ficam deferidos (sem operação ativa), com trip-wires no ADR-0014 para reabrir.

`SKILL.md` é mantido aqui como **registro histórico** — não foi reescrito. A skill já não é descoberta pelos harnesses (o symlink em `.claude/skills/` foi removido). Se o board voltar a ser necessário (ex.: >10 tarefas concorrentes ou co-trabalho não-solo, conforme os trip-wires do ADR-0014), este protocolo é o ponto de partida.
