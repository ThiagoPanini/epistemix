# Instruções para GitHub Copilot

A fonte canônica de instruções operacionais deste repositório é [`AGENTS.md`](../AGENTS.md) na raiz. Leia esse arquivo antes de qualquer sugestão substantiva.

Documentação adicional obrigatória:

- [`docs/VISION.md`](../docs/VISION.md) — por que o produto existe
- **Sistema visual:** contrato as-built em [`docs/design/`](../docs/design/README.md). O bundle congelado da Direção A em `.claude/design/epistemix-redesenho-completo/` é origem creditada, não fonte-da-verdade.
- [`docs/CONTEXT.md`](../docs/CONTEXT.md) — glossário e invariantes de domínio
- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — desenho de alto nível e boundaries
- [`docs/adr/`](../docs/adr/) — decisões registradas. Execução vive nas issues do GitHub (label `agent-ready`); não há ROADMAP faseado.
- [`docs/agents/`](../docs/agents/) — instruções operacionais modulares (convenções, autonomia e fluxo, MCPs), lidas sob demanda.

As regras de stack, git, boundaries e segurança vivem em [`AGENTS.md`](../AGENTS.md) e nos módulos de [`docs/agents/`](../docs/agents/) — não são duplicadas aqui para não divergirem.
