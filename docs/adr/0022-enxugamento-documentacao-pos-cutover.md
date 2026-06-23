# ADR 0022 — Enxugamento da documentação pós-cutover: modelo enxuto inspirado no panlabs

- **Status:** Accepted
- **Data:** 2026-06-23
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** emenda o [ADR-0017](0017-desenvolvimento-autonomo-afk.md) (aposenta o diário `docs/ai-ops/`); consequência do cutover do rebatismo ([ADR-0021](0021-rebatismo-ethitorial-e-migracao-panlabs-tech.md)); não altera o substrato de execução por issues ([ADR-0019](0019-redesenho-prototipo-absoluto-push-feature-completo.md)).

## Contexto

A documentação do repo cresceu durante uma fase deliberada de **aprendizado**, em que o operador queria registrar tudo o que acontecia na infra e no processo: `docs/ai-ops/` (diário de ops), `docs/guides/` (how-tos de setup de MCP/VPS), `docs/lessons/` (retrospectivas) e `docs/runbooks/` (procedimentos operacionais). Somavam ~26 arquivos. Esse material cumpriu seu papel enquanto a fundação estava sendo construída.

Com a fundação **fechada e no ar** e o cutover do rebatismo concluído, esse acervo passou a **atrapalhar mais do que ajudar**: polui `find`/`grep`/navegação, e — mais importante — engorda a janela de contexto dos agentes a cada sessão, que é justamente o recurso escasso do fluxo AFK. O `AGENTS.md` (174 linhas) carregava em toda sessão um nível de detalhe operacional que raramente é necessário de imediato.

O repo-irmão `panlabs` serve de referência de um arranjo enxuto: um `CLAUDE.md` curto, `docs/` com apenas os docs vivos (`VISION`, `CONTEXT`, `adr/`) e um `docs/agents/` modular com instruções operacionais lidas **sob demanda** — sem `ai-ops`/`guides`/`lessons`/`runbooks`/`ROADMAP`.

## Decisão

Adotar um **modelo de documentação enxuto**, separando o que é **vivo** (carrega/orienta a cada sessão) do que é **histórico** (preservado no git history, fora do working tree).

1. **Remover do working tree → git history** (lossless, recuperável): `docs/ai-ops/`, `docs/guides/`, `docs/lessons/`, `docs/runbooks/`, `docs/specs/`, `docs/ROADMAP.md` (já aposentado pelo [ADR-0019](0019-redesenho-prototipo-absoluto-push-feature-completo.md)) e os artefatos órfãos da skill `impeccable` (`/DESIGN.md`, `/PRODUCT.md`, `.impeccable/`).

2. **Fonte única de design.** O sistema visual vive só em [docs/DESIGN.md](../DESIGN.md) (Direção A "Prensa", laranja — bate com o app no ar e com o protótipo). O `/DESIGN.md` da raiz (azul "caderno de laboratório", artefato do `impeccable` nunca implementado) e o `docs/design/0001` (superseded) foram removidos.

3. **`AGENTS.md` modular (padrão panlabs).** O `AGENTS.md` vira um orientador curto (~70 linhas) que carrega em toda sessão; o detalhe operacional migra para `docs/agents/` e é lido sob demanda: `conventions.md`, `afk-ops.md`, `mcps.md`, `workflow.md`.

4. **Diário de ops aposentado.** A convenção `docs/ai-ops/` (§4 do [ADR-0017](0017-desenvolvimento-autonomo-afk.md)) é encerrada; o audit trail das operações 🟡 passa a ser o `git log` (commit/PR que dispara a operação). Ver emenda 2026-06-23 no ADR-0017.

**Docs vivos remanescentes:** `docs/VISION.md`, `docs/CONTEXT.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/design/`, `docs/adr/` e `docs/agents/`.

### Emenda 2026-06-23: contrato de design as-built

Após o redesign estar implementado e no ar, `docs/DESIGN.md` deixou de ser suficiente como única fonte operacional para agentes. O sistema visual passa a viver em `docs/design/`, com contratos por componente, procedência e deltas. `docs/DESIGN.md` permanece como entrada curta de compatibilidade. O bundle congelado da Direção A em `.claude/design/` é origem creditada; divergências de forma resolvem a favor do código as-built.

## Justificativa

- **Contexto é o recurso escasso do AFK.** Cada token gasto carregando histórico operacional a cada sessão é um token a menos para o trabalho. Enxugar a carga base é o maior ganho direto.
- **Git history é lossless.** Nada se perde: o material de aprendizado continua 100% recuperável (`git log`/`git show`), só deixa de poluir o working tree e a navegação dos agentes.
- **Separar vivo de histórico.** Um doc que orienta trabalho futuro é vivo; um registro do que já aconteceu é histórico. O primeiro fica; o segundo migra para o git.
- **panlabs valida o arranjo.** O repo-irmão opera enxuto sem perder rastreabilidade — o `docs/agents/` modular dá o detalhe quando preciso, sem pesar a entrada.

## Consequências

### Positivas

- Sessões de agente abrem com carga de contexto muito menor (`AGENTS.md` 174 → ~70 linhas; ~26 arquivos de docs fora da navegação).
- Uma única fonte de verdade visual elimina a contradição laranja/azul que confundia agentes.
- Audit trail de ops mais simples (git em vez de pasta paralela a manter manualmente).

### Negativas

- **Links quebrados em ADRs/históricos antigos.** ADRs anteriores (ex.: o [ADR-0017](0017-desenvolvimento-autonomo-afk.md) referencia `../guides/0004-0006`, `../lessons/0002`, `../ai-ops/`) passam a ter links que só resolvem no git history. Aceito: ADRs preservam a nomenclatura e os ponteiros da sua época; o conteúdo segue recuperável. Não reescrevemos ADRs históricos para "consertar" links.
- **Material operacional menos à mão.** Recuperar um runbook (ex.: restore de Postgres) exige `git log`/`git show` em vez de abrir um arquivo. Mitigado por ser raro em steady state e pelo `docs/agents/afk-ops.md` cobrir o fluxo corrente.

## Pendente (processo apartado)

A **validação de conteúdo** de `VISION.md`, `CONTEXT.md` e `ARCHITECTURE.md` (precisão da prosa pós-rebatismo) e a validação profunda da direção de `DESIGN.md` ficam para uma sessão `grill-with-docs` focada — natureza diferente (reescrita cuidadosa de prosa), fora do escopo desta limpeza estrutural.

## Opções rejeitadas

- **Arquivar em `docs/_archive/` em vez de deletar.** Ainda apareceria em `find`/`grep` e tentaria o "só dar uma olhada". O git history entrega o mesmo (preservação) sem o ruído.
- **Manter `ai-ops` como log append-only.** Diverge do panlabs e mantém uma pasta a alimentar manualmente; o `git log` já registra toda mudança de estado disparada por commit/merge.
- **Trim moderado do `AGENTS.md` em arquivo único.** Reduziria linhas mas continuaria carregando todo o detalhe operacional a cada sessão; o `docs/agents/` modular resolve a carga, não só o tamanho.
- **Deletar também `ARCHITECTURE.md`.** É referência viva (FastAPI + hexagonal), não cruft de aprendizado; fica, com validação de conteúdo adiada.
