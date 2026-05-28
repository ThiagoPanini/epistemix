# ADR 0013 — Substrato de planejamento operado por agentes (GitHub Projects)

- **Status:** Accepted (revisado 2026-05-27)
- **Data:** 2026-05-27
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0005](0005-deploy-checks-em-tres-portoes.md) (portões de deploy), [ADR-0001](0001-monorepo-and-boundaries.md) (boundaries de domínio), [AGENTS.md](../../AGENTS.md) (regra de fonte única), [VISION.md](../VISION.md) (processo como produto), [lesson 0002](../lessons/0002-harness-basico-em-github-projects.md) (princípios evergreen do harness)
- **Histórico de refinamento:**
  - **R1 (2026-05-27)** — desenho aprofundado em sessão de grilling: harnesses múltiplos, encapsulamento em skill, portão de merge, enforcement por construção.
  - **R2 (2026-05-27)** — **revisão de fundação após pesquisa de mercado** (estado de mai/2026). Constatou-se que (a) a vitrine pública AI-first não justifica o harness pesado na Fase 0; (b) a fragilidade percebida vinha dos scripts bash GraphQL, não do board; (c) o GitHub MCP server passou a operar Projects v2; (d) o cockpit de execução é o VS Code local, não pull autônomo. As seções abaixo já refletem R2. O que R1 decidiu e R2 reverteu está registrado em **Decisões revertidas em R2**.

## Contexto

O projeto rastreava **todo** o trabalho nos checkboxes do [ROADMAP.md](../ROADMAP.md). Queríamos, desde a Fase 0 (antes de qualquer linha de código de produto):

1. **Um lugar visual único** para acompanhar trabalho humano e de agentes, distinguindo o que é tarefa do operador (`Human`) do que é delegável a um agente (`Agent`/`Pairing`).
2. **Um substrato que agentes consigam ler e atualizar** — descobrir trabalho, reportar progresso, sinalizar bloqueios — sem corromper a própria fonte de decisão.
3. **Exercitar a dinâmica enquanto o custo de errar é baixo** (tarefas de setup, reversíveis).

O **GitHub Wiki** foi avaliado e rejeitado em análise separada (problema de fonte única, ausência de indexação/SEO, invisibilidade aos agentes). O **GitHub Projects** é categoricamente diferente: não compete com `docs/` por conhecimento, é **acessível a agentes** (agora via GitHub MCP server) e trata de *estado de execução*, não de *conhecimento versionado*.

### O risco central

Com agentes lendo e escrevendo no board, a duplicação de informação entre `ROADMAP.md` e o board deixa de ser "sync ocasional" e vira **divergência contínua** — e **corrompe o input de decisão dos agentes**. O desenho elimina essa classe de bug **por construção** (partição), não por disciplina.

### O que a pesquisa de mai/2026 mudou (motivação de R2)

A primeira tentativa entregou **cerimônia, não automação nem visibilidade**. O diagnóstico:

- O peso (scripts bash GraphQL, 4 campos custom, 15 labels, máquina de 6 estados, 4 subagents, ~900 linhas de doc) foi construído **antes de o board provar valor** — exatamente o over-engineering que a [lesson 0002](../lessons/0002-harness-basico-em-github-projects.md) adverte.
- A justificativa principal para fazer isso **agora, à mão** era o 3º pilar da [VISION](../VISION.md) (processo como produto / vitrine pública AI-first). Mas uma vitrine de engenharia AI-first só convence quando há **produto** sendo construído AI-first. Um harness auto-referente operando 16 tarefas de setup é **andaime, não vitrine** — logo o 3º pilar **não justifica a cerimônia na Fase 0**.
- A fragilidade percebida vinha dos **scripts bash GraphQL**, não do board. O **GitHub MCP server** (toolset `projects`, REST por baixo desde out/2025, consolidado em jan/2026) lê e escreve campos single-select de Projects v2 via tool-call tipado, consumível por Claude Code, Codex e Copilot — **eliminando os scripts**.
- O **cockpit de execução** é o **VS Code local** com os três agentes, não pull autônomo a partir do board. Isso colapsa estados e elimina a necessidade de orquestração pesada.

## Decisão

Adotar **um** GitHub Projects v2 como **instrumento de visibilidade** (não cockpit de trabalho), governado pelo princípio de **partição, não duplicação**, operado pelo **GitHub MCP server**, e mantido no **menor desenho que entrega o objetivo** — crescendo só quando uma dor real puxar.

### Princípio de fonte única por partição (inalterado)

| Informação | Lar único | Por quê |
|---|---|---|
| Estratégia e marcos de fase | `ROADMAP.md` (versionado, gated) | Narrativa e "porquê"; lido pelos agentes em `docs/` |
| Spec da tarefa granular | **Corpo da Issue** | Está no grafo do GitHub, linkável, notifica ao mudar |
| Status/progresso ao vivo | **Campos do board** | Estado operacional efêmero; agente/operador escreve livremente |
| Roadmap visual para consulta | **View do Projects** | **Projeção** das issues — lê delas, ninguém edita à mão |

O `ROADMAP.md` fala de *marcos*; o board fala de *tarefas*. Como falam de altitudes diferentes, não podem divergir. Status é **estado efêmero, não conhecimento** — não vai para o git. O que merece versionamento — **código e decisões nos PRs/docs** — continua gated pelos portões do [ADR-0005](0005-deploy-checks-em-tres-portoes.md).

### Modelo de dados (enxuto — revisado em R2)

**Campos do Project v2** — dois eixos ortogonais, e só:

| Campo | Valores | Eixo | Quem escreve |
|---|---|---|---|
| `Status` | `Backlog` · `In progress` · `In review` · `Done` | ciclo de vida | agente (via MCP) / built-in / operador |
| `Owner` | `Human` · `Agent` · `Pairing` | **intenção de roteamento** | Humano (triagem) |

- `Owner` responde "quem **deveria** fazer"; o **assignee nativo** da issue responde "quem **está** fazendo" (a conta do agente, quando delegado). São coisas diferentes — não sobrecarregar o assignee com semântica de roteamento.
- **`Phase` e `Priority` deixam de ser campos.** Fase vira **label** (`phase-0`…`phase-4`) — antes era campo *e* label, duplicado. Prioridade é dropada (reintroduzir como campo só se o backlog crescer a ponto de doer).

**Labels:**

| Grupo | Labels |
|---|---|
| Fase | `phase-0` … `phase-4` |
| Estado especial | `someday` (parado/imaturo; fora da view padrão), `blocked` (travado por externo; ver máquina de estados) |
| Scope (espelha o regex de branches do ADR-0005) | `infra`, `ci`, `web`, `api`, `docs`, `catalog`, `identity`, `engagement`, `narration`, `shared`, `platform` |
| Curadoria | `proposed` (issue aberta por agente, aguardando triagem humana) |

### Operação — GitHub MCP server (revisado em R2)

O board é operado pelo **GitHub MCP server oficial** (toolset `projects` habilitado), não por scripts. Os três agentes (Claude Code, Codex, Copilot) leem e escrevem via tool-call:

- **`projects_get`** — lê itens, campos e *options* (resolve os IDs de field/option necessários para escrever single-select).
- **`projects_write`** — adiciona/remove itens e atualiza valor de campo (mover `Status`, setar `Owner`).

Pegadinha a documentar na skill: escrever em single-select exige resolver `field id` + `option id` (obtidos via `projects_get`) antes do `projects_write`. Sem scripts bash, sem GraphQL cru, sem `jq`.

### Protocolo do agente — máquina de 4 estados (revisado em R2)

```
Backlog ──► In progress ──(PR aberto)──► In review ──(PR merge)──► Done
   │            │                                                     ▲
   │            └──── tarefa sem PR: operador fecha a issue ──────────┘
   │
   ├─ label someday  = parado/imaturo (filtrado fora da view padrão)
   └─ label blocked  = travado por externo; sai de In progress e volta pro Backlog
```

- `Todo` (de R1) foi **colapsado em `Backlog`**: ele existia para *pull autônomo* (agente varria o board e puxava o que estava "pronto"). Como o **despacho é manual, do VS Code**, o portão de curadoria deixa de ser uma coluna e vira **o ato de despachar**. `Backlog` = fila pronta para executar; `someday` segrega o que não está pronto.
- `Blocked` (de R1) virou **label**, não status. Quando uma tarefa trava em algo externo (segredo, registrar/DNS, produção, decisão humana), recebe label `blocked` + comentário do motivo e **volta pro Backlog** — sai de `In progress` para manter essa coluna honesta ("exatamente o que está sendo executado").
- Tarefas sem PR (infra/humano, ex.: "criar conta Cloudflare") seguem `Backlog → In progress → Done` (operador fecha a issue; built-in `issue fechada → Done`). `In review` só se aplica a tarefas que produzem PR.

**Transições e quem as dispara:**

| Transição | Disparo |
|---|---|
| item adicionado → `Backlog` | built-in do Projects (configurável) |
| `Backlog` → `In progress` | agente seta via `projects_write` ao começar (ou operador) |
| `In progress` → `In review` | agente seta via `projects_write` ao abrir o PR (`Closes #N`) |
| `In review` → `Done` | built-in: PR mergeado → `Done` |
| `In progress` → `Done` (sem PR) | built-in: issue fechada → `Done` |

Sem GitHub Action custom a manter: built-ins cobrem entrada e saída; os dois passos intermediários o agente seta via MCP.

### Assimetria de autonomia (inalterada — núcleo do desenho)

| Autônomo (agente, sem gate) | Gated (humano no loop) |
|---|---|
| Ler board, mover status (via MCP), comentar plano | Promover `someday`/`proposed` para a fila pronta (curadoria) |
| Executar em branch, abrir PR | **Merge do PR** (verificação real, ADR-0005) |
| **Propor** issue nova (entra como `proposed`) | Segredos, registrar, settings, estado de produção |

O agente **consome, executa e reporta**; o humano **cura o backlog e aprova o merge**. Mover um card via MCP não decide nada irreversível — por isso é ungated. Os pontos caros são protegidos **por construção**, não por prosa:

- **Merge:** branch protection na `main` (exigir PR, sem push direto) — server-side, vale para os três agentes.
- **Segredos / registrar / prod:** **remoção de capability** (credencial catastrófica fora do alcance de qualquer agente — defesa primária e portável) + deny/sandbox por harness como defesa em profundidade.

### Cockpit de execução — VS Code local (novo em R2)

O board é visibilidade; o **trabalho acontece no VS Code** com três agentes coexistindo (Agent Sessions view):

- **Claude Code** — motor principal: plan mode → execução → **hooks** (lint/test = portão pre-push do ADR-0005) → PR.
- **Copilot** — autocomplete + agent local de apoio.
- **Codex** — executor alternativo (lê `AGENTS.md` nativo).

Para evitar o único risco real (conflito de merge entre agentes paralelos), **particionar trabalho por boundary de domínio** (ADR-0001) usando **git worktree por agente**. Subagents não fazem parte do desenho mínimo (frota = over-engineering para solo, 4-7× tokens); no máximo, eventualmente, um revisor read-only travado.

**Delegação nativa na nuvem** (GitHub Agent HQ / `claude-code-action`) fica como **overflow opcional documentado** para uma issue atômica que se queira largar — não como modo principal (tira o operador do VS Code) e **exige ADR** antes de adotar (dependência paga, conforme [AGENTS.md](../../AGENTS.md)).

### Onde o protocolo vive

O protocolo operacional vive na skill **`operate-planning-board`** (`.agents/skills/operate-planning-board/`, lida nativamente por Codex e Copilot; symlink em `.claude/skills/` para o Claude Code). Após R2 a skill é **fina**: protocolo em prosa + referência às tools MCP (`projects_get`/`projects_write`) + a receita de resolução de IDs. **Os scripts `scripts/` foram removidos** (substituídos pelo MCP). O [AGENTS.md](../../AGENTS.md) tem só um ponteiro de uma linha para a skill; a decisão e o porquê ficam neste ADR; os princípios evergreen na [lesson 0002](../lessons/0002-harness-basico-em-github-projects.md).

## Justificativa

- **Por que partição e não duplicação:** dois escritores em duas cópias divergem sempre; partição dá um lar por informação e por construção não pode divergir.
- **Por que o board (e não só Issues+labels):** há requisito real de **roteamento humano/agente/híbrido + status tipado** que labels representam mal; o board, como visualização agrupada por `Owner`/`Status`, serve isso. *Se* o roteamento por campo fosse abandonado, Issues+labels seria mais enxuto — não é o caso.
- **Por que GitHub-native e operado por MCP:** mantém issues↔PRs↔gates no mesmo lugar; o MCP elimina a fragilidade dos scripts e é consumível pelos três agentes.
- **Por que mínimo agora:** a vitrine (3º pilar) não justifica peso na Fase 0; o board prova valor primeiro, e cresce puxado por dor.

## Consequências

### Positivas

- Fonte única preservada por partição; agentes decidem a partir de dados não-ambíguos.
- Objetivo de visibilidade (`Owner=Human` vs `Agent`/`Pairing`) atendido por filtro de view.
- Fragilidade dos scripts eliminada: operação por tool MCP tipado, igual para os três agentes.
- Superfície reduzida (4 campos→2, 6 estados→4, scripts→0, 4 subagents→0) — menos a manter e a divergir.
- O produto do trabalho (PR) continua passando pelos portões do ADR-0005; só o *estado* é ungated.

### Negativas

- O status vive no DB do GitHub, não no git — não versionado, não portável (aceitável para estado efêmero).
- A operação depende do **GitHub MCP server** configurado em cada harness (toolset `projects` não vem por default; exige scope `project`). É um pré-requisito de setup, não código a manter.
- A vitrine pública AI-first fica **deferida** para quando houver produto sendo construído via harness — o 3º pilar da VISION não é exercitado na Fase 0.

### Critério de reversão e trip-wires

- **Reverter/simplificar o board** se virar escrituração > valor.
- **Voltar a `Issues`+labels** (dropar o Projects) se o roteamento por campo deixar de agregar.
- **Reintroduzir `Priority`/estados** só quando uma dor concreta (backlog grande, claim órfão frequente) justificar.
- **Adotar delegação nativa na nuvem** (registrar ADR antes — dependência paga) quando uma carga de issues atômicas paralelas justificar o overflow.
- **Adotar SDD leve** (OpenSpec, não Spec Kit) só na Fase 1, e só em feature de lógica densa, se houver drift entre intenção e código.

## Opções rejeitadas

- **Só `ROADMAP.md` (status quo):** suficiente para backlog minúsculo, mas não dá a visibilidade de roteamento humano/agente nem é acessível a agentes como o board.
- **Board como fonte de tudo (specs incluídas):** specs ficariam fora do git e dos portões.
- **`ROADMAP.md` como fonte, board como espelho gerado:** custo de motor de sync, PR por tique de status, view derivada não-confiável como verdade ao vivo.
- **Operar o board por scripts bash GraphQL (desenho de R1):** frágil, exige `jq`/resolução manual de IDs, e três variações por harness; substituído pelo GitHub MCP server.
- **Cockpit autônomo com pull do board + frota de subagents (desenho de R1):** over-engineering para solo; o cockpit real é o VS Code com despacho manual.
- **Spec Kit / Task Master AI agora:** cerimônia pesada e/ou substrato de planejamento concorrente; rejeitados na Fase 0 (ver trip-wires para OpenSpec na Fase 1).
- **Ferramenta externa (Linear/Jira):** mais um lar fora do repo, overkill para solo.

### Decisões revertidas em R2

| R1 decidiu | R2 reverteu para | Por quê |
|---|---|---|
| Máquina de 6 estados (com `Todo` e `Blocked` como status) | 4 estados; `blocked`/`someday` como label | despacho manual elimina `Todo`; `blocked`-label mantém `In progress` honesto sem +1 coluna |
| Campos `Status`/`Phase`/`Owner`/`Priority` | `Status` + `Owner`; `Phase`→label; `Priority` dropado | remover duplicação e campo não usado |
| Scripts bash GraphQL (`claim`/`submit`/`block`/`set-single-select`) | tools do GitHub MCP server | elimina fragilidade; uma operação para os três agentes |
| Hand-roll justificado pelo 3º pilar (vitrine) na Fase 0 | desenho mínimo; vitrine deferida | vitrine só convence com produto real |
| 4 subagents (`board-scout`/`task-executor`/`doc-crafter`/`code-reviewer`) | nenhum (eventual revisor read-only) | frota = over-engineering para solo |

---

## Apêndice operacional (estado-alvo após R2)

> Pré-requisito: **GitHub MCP server** instalado e com o toolset `projects` habilitado em cada harness (Claude Code, Codex, Copilot), com token de scope `project`. A operação do dia a dia está no [runbook 0002](../runbooks/0002-harness-agente-solo.md) e na skill [`operate-planning-board`](../../.agents/skills/operate-planning-board/SKILL.md).

### A. Migração do board #4 (operação humana, fora de sessão de agente)

1. **Status:** renomear/reduzir opções para `Backlog · In progress · In review · Done` (mover itens hoje em `Todo`→`Backlog`; `Blocked`→`Backlog` + label `blocked`).
2. **Campos:** remover `Phase` e `Priority` como campos do Project (manter `phase-N` como label).
3. **Labels:** garantir `someday` e criar `blocked`; manter scope/curadoria.
4. **Views:** "Board" (kanban por `Status`, filtrar `-label:someday`), "Minha fila" (filtro `Owner=Human`), "Delegável" (`Owner∈{Agent,Pairing}`).
5. **Automações built-in (UI):** item adicionado → `Backlog`; issue fechada → `Done`; PR mergeado → `Done`.

### B. Corpus de issues da Fase 0

Inalterado em conteúdo (16 issues já criadas); muda só a representação: sem campo `Phase`/`Priority`, `Owner` mantido, `phase-0` como label.

### C. `ROADMAP.md`

Mantém os checkboxes granulares como plano versionado enquanto o board é experimento; o board é a *view ao vivo* (filtro `phase-0`) e o ROADMAP **linka** essa view em vez de duplicar status por tarefa. Esvaziar o ROADMAP só **se** o board provar valor ao fim da Fase 0.
