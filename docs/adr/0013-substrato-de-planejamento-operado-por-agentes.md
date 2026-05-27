# ADR 0013 — Substrato de planejamento operado por agentes (GitHub Projects)

- **Status:** Proposed
- **Data:** 2026-05-27
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0005](0005-deploy-checks-em-tres-portoes.md) (portões de deploy), [AGENTS.md](../../AGENTS.md) (regra de fonte única), [VISION.md](../VISION.md) (processo como produto), [lesson 0002](../lessons/0002-harness-basico-em-github-projects.md) (princípios evergreen do harness)
- **Refinamento:** desenho aprofundado em sessão de grilling (2026-05-27) — decisões sobre harnesses múltiplos, encapsulamento em skill, portão de merge e enforcement por construção integradas abaixo.

## Contexto

Hoje o projeto rastreia **todo** o trabalho nos checkboxes do [ROADMAP.md](../ROADMAP.md). O repositório tem **zero issues, zero milestones e apenas os labels default** do GitHub — a própria convenção de backlog (`issue com label someday`) que o ROADMAP prescreve ainda não existe.

Queremos, desde a Fase 0 (antes de qualquer linha de código de produto):

1. **Um lugar visual único** para acompanhar trabalho humano e de agentes, distinguindo o que é tarefa do operador (`Human`) do que um agente está tocando (`Agent`/`Pairing`).
2. **Um substrato que agentes operem de forma autônoma** — descobrir trabalho, reivindicar, executar, reportar progresso, sinalizar bloqueios — para tomar decisões e gerenciar o andamento.
3. **Construir e endurecer essa dinâmica enquanto o custo de errar é baixo** (tarefas de setup, reversíveis), aprendendo os modos de falha de um harness agêntico antes de haver código com stakes reais.
4. **Alinhamento com o terceiro pilar da [VISION](../VISION.md)** — "o próprio processo de construção é parte do produto... exemplo público de engenharia AI-first". Um board público operado por agentes é uma demonstração literal desse pilar.

O **GitHub Wiki** foi avaliado e rejeitado em análise separada (problema de fonte única, ausência de indexação/SEO, invisibilidade aos agentes). O **GitHub Projects** é categoricamente diferente: não é conteúdo/documentação (não compete com `docs/` por conhecimento), é **acessível a agentes** via API GraphQL e `gh`, e trata de *estado de execução*, não de *conhecimento versionado*.

### O risco central

Com agentes atuando como **escritores autônomos** sobre um board, a duplicação de informação entre `ROADMAP.md` e o board deixa de ser "trabalho de sync ocasional" e vira **divergência contínua** — e, pior, **corrompe o input de decisão dos próprios agentes**: um agente que decide a partir da cópia desatualizada faz a coisa errada com confiança. O desenho precisa eliminar essa classe de bug por construção, não por disciplina.

## Decisão

Adotar **um** GitHub Projects v2, governado pelo princípio de **partição, não duplicação**: cada informação tem exatamente um lar, e lares diferentes guardam coisas de **altitudes diferentes**, de modo que não possam descrever a mesma coisa (logo, não podem divergir).

### Princípio de fonte única por partição

| Informação | Lar único | Por quê |
|---|---|---|
| Estratégia e marcos de fase | `ROADMAP.md` (versionado, gated) | Narrativa e "porquê"; lido pelos agentes em `docs/` |
| Spec da tarefa granular | **Corpo da Issue** | Está no grafo do GitHub, linkável, notifica ao mudar |
| Status/progresso ao vivo | **Campos do board** | Estado operacional efêmero; agente escreve livremente |
| Roadmap visual para consulta | **View de roadmap do Projects** | **Projeção** das issues — lê delas, ninguém edita à mão |

Consequência direta: o `ROADMAP.md` **deixa de listar checkboxes granulares** (eles viram issues). Como ROADMAP fala de *marcos* e o board fala de *tarefas*, eles não podem divergir.

### Por que o board é a fonte de **status** (e não o inverso)

Rejeitamos manter `ROADMAP.md` como fonte com o board gerado como espelho porque isso exigiria (a) construir um motor de sync agora; (b) o agente abrir PR a cada tique de status (pesadíssimo); (c) tornar o lugar visual um derivado em que não se confia como atual. Status é **estado operacional efêmero, não conhecimento** — versioná-lo em git é cerimônia sem retorno.

Precisão importante (revista no refinamento): a **spec no corpo da issue também é efêmera e ungated** — está no grafo e notifica ao mudar, mas não é versionada nem passa por portão, e um agente pode editá-la. Não a tratamos como conhecimento versionado. O que de fato merece versionamento — **código e decisões nos PRs** — continua versionado e passando pelos portões do [ADR-0005](0005-deploy-checks-em-tres-portoes.md). Dois mecanismos protegem a spec da issue sem versioná-la: (1) o **merge gate é o backstop** — o operador revisa o PR contra a intenção antes de mergear; (2) a **regra de graduação** já vigente — se a tarefa exige decidir algo arquitetural ou mudar invariante de domínio, ela para e a decisão gradua para ADR/`CONTEXT.md` (gated) *antes* do código (ver [AGENTS.md](../../AGENTS.md)). Mudança de critério de aceite pelo agente entra como **comentário**, não edição silenciosa.

### Modelo de dados

**Labels** (taxonomia a criar):

| Grupo | Labels |
|---|---|
| Fase | `phase-0` … `phase-4`, `someday` |
| Scope (espelha o regex de branches do ADR-0005) | `infra`, `ci`, `web`, `api`, `docs`, `catalog`, `identity`, `engagement`, `narration`, `shared`, `platform` |
| Curadoria | `proposed` (issue aberta por agente, aguardando triagem humana) |

**Campos do Project v2:**

| Campo | Valores | Quem escreve |
|---|---|---|
| `Status` | `Backlog` · `Todo` · `In progress` · `In review` · `Done` · `Blocked` | Agente / automação |
| `Phase` | `0`–`4` | Humano (triagem) |
| `Owner` | `Human` · `Agent` · `Pairing` | Humano (triagem) |
| `Priority` | `P0`–`P2` (opcional) | Humano |

### Harnesses que operam o board

O board é operado por **três harnesses autônomos** — Claude Code, OpenAI Codex e GitHub Copilot coding agent — todos lendo o [AGENTS.md](../../AGENTS.md) como fonte única e a skill `operate-planning-board` (ver "Onde o protocolo vive"). Na prática os três são usados **individualmente** (raramente concorrentes), o que mantém a colisão como não-objetivo.

Modo de operação no loop mínimo: **hand-roll** sob o token do operador, com a branch protection segurando o merge (required-approvals=0 — o operador aprova clicando merge; ver Consequências). Construir e endurecer o harness à mão **é** parte do objetivo (aprender os modos de falha + 3º pilar da [VISION](../VISION.md)), não só coordenar trabalho. **Delegar a um coding agent nativo** (Copilot / `claude-code-action`), que já implementa "assign issue → planeja → abre PR → pede review", fica como **escape hatch documentado** — adotado quando o hand-roll parar de ensinar (ver trip-wires).

### Protocolo do agente

**Máquina de estados (`Status`):**

```
        ┌──────────┐  triagem humana   ┌──────┐  agente reivindica  ┌─────────────┐
        │ Backlog  │ ────────────────► │ Todo │ ──────────────────► │ In progress │
        │(someday/ │                   └──────┘                     └─────┬───────┘
        │ proposed)│                       ▲                              │ abre PR (Closes #N)
        └──────────┘                       │ desbloqueio                  ▼
                                      ┌──────────┐               ┌─────────────┐
                                      │ Blocked  │ ◄──────────── │  In review  │
                                      └──────────┘  precisa de   └─────┬───────┘
                                                    humano/externo     │ PR mergeado (gates ✅)
                                                                       ▼
                                                                  ┌────────┐
                                                                  │  Done  │
                                                                  └────────┘
```

**Ciclo de vida:**

| Passo | Ator | Ação | Efeito no board | Gated? |
|---|---|---|---|---|
| 1. Descoberta | Agente | `gh project item-list` → filtra `Status=Todo, Phase=0, Owner∈{Agent,Pairing}` | — | autônomo |
| 2. Reivindica | Agente | assigna-se + comenta "claimed @ ts"; relê para confirmar o claim | → `In progress` | autônomo |
| 3. Plano | Agente | comenta o plano de execução na issue | — | **checkpoint** (humano pode vetar) |
| 4. Executa | Agente | branch `^(feat\|fix\|chore\|docs)/<scope>-<slug>` (ADR-0005), commits | — | autônomo |
| 5. Submete | Agente | abre PR com `Closes #N` | → `In review` | autônomo |
| 6. Revisa/merge | **Humano** | review + merge | → `Done` (automação) | **GATE DURO (ADR-0005)** |
| 7. Bloqueio | Agente | esbarrou em registrar/segredo/prod | → `Blocked`, `Owner=Human`, comenta o que precisa | autônomo |

Transições adicionais (completando a máquina de estados): PR rejeitado em review volta `In review → In progress`; `Blocked` é só para bloqueio **externo** (humano/segredo/registrar), não para rework; claim órfão (`In progress` cujo agente sumiu) é tratado por **checagem manual ocasional** — uso individual não justifica um reaper automatizado.

**Assimetria de autonomia** (núcleo do desenho):

| Autônomo (agente, sem gate) | Gated (humano no loop) |
|---|---|
| Ler board, reivindicar, comentar plano | Promover issue de `Backlog`→`Todo` (curadoria) |
| Executar em branch, mover status | Merge do PR (verificação real, ADR-0005) |
| **Propor** issue nova (entra como `proposed`/`Backlog`) | Segredos, registrar, settings, estado de produção |

O agente **consome, executa e reporta**; o humano **cura o backlog e aprova o merge**. A escrita ungated do agente no board é segura porque mover um card não decide nada irreversível.

A coluna gated, porém, **não pode ser defendida só por prosa** — ainda mais com `bypassPermissions` ligado, em que o harness não pede confirmação. Ela é **enforcement por construção**:

- **Merge:** branch protection na `main` (exigir PR, sem push direto) — server-side, vale para os três harnesses e independe do `bypassPermissions`. Ligada já, desacoplada do CI completo do M0.2 (ver Consequências).
- **Segredos / registrar / prod:** **remoção de capability** (credencial catastrófica fora do alcance de qualquer agente — primária e portável) + **deny/sandbox por harness** (`permissions.deny` no Claude Code, sandbox+approval no Codex, firewall/allowlist no Copilot) como defesa em profundidade.

**Colisão multi-agente — não-objetivo.** Como os três harnesses são usados individualmente, a concorrência real é ~nula. Reivindicar seta `assignee` + status como **registro de claim** (não como lock), e uma releitura trivial é seguro de centavos. Sem mutex — a GraphQL do Projects nem tem compare-and-swap. Revisitar só se o uso virar concorrente (ex.: Copilot assíncrono em paralelo a uma sessão local — ver trip-wires).

### Onde o protocolo vive

O **protocolo operacional** vive na skill **`operate-planning-board`** — diretório canônico `.agents/skills/operate-planning-board/` (lido nativamente por Codex e Copilot), com symlink em `.claude/skills/` para o Claude Code enxergar a mesma cópia física. A skill contém:

- **`SKILL.md`** — o protocolo em prosa, **fonte única** que os três harnesses carregam via progressive disclosure (substitui a ideia anterior de uma seção de regras no `AGENTS.md`: três modelos lendo um texto só é melhor que três cópias).
- **`scripts/`** — o **determinístico**: set de campo via GraphQL (resolve IDs de campo/opção), claim (assignee + status + releitura), submit (abre PR + `In review`), block. Roda idêntico não importa qual modelo invoca.

O [AGENTS.md](../../AGENTS.md) recebe só um **ponteiro de uma linha** para a skill. A **decisão e o porquê** ficam neste ADR. Os **passos de setup humano** viram um guide.

## Justificativa

- **Por que partição e não duplicação:** duplicação tem dois escritores em duas cópias e diverge sempre; partição dá um lar por informação e por construção não pode divergir. Com agentes como segundo escritor, "manter sincronizado no olho" deixa de ser controlável.
- **Por que agora (Fase 0):** é o momento de menor custo para debugar o harness; tarefas de setup são reversíveis; aprende-se a dinâmica antes de haver código com stakes.
- **Por que GitHub-native e não Linear/Jira:** evita um lar fora do repo/grafo, mantém issues↔PRs↔gates no mesmo lugar, e é o que os agentes já acessam via `gh`/API.

## Consequências

### Positivas

- Fonte única preservada por partição; agentes decidem a partir de dados não-ambíguos.
- Objetivo de visibilidade (`Owner=Human` vs `Agent`) atendido por filtro de view.
- O produto do trabalho (PR) continua passando pelos três portões do ADR-0005; só o *estado* é ungated.
- Board público vira vitrine do terceiro pilar da VISION.
- Harness exercitado em tarefas de baixo risco antes da Fase 1.

### Negativas

- O status vive no DB do GitHub, não no git — não versionado e não portável se o projeto sair do GitHub (aceitável para estado efêmero).
- Algumas transições (`PR aberto → In review`, claim) não são automações built-in; ficam no `scripts/` da skill (agente seta via API). As built-in cobrem item adicionado→`Todo`, issue/PR fechado e PR mergeado→`Done`.
- O protocolo precisa ser seguido pelos três harnesses; se ignorado, o drift volta. Mitigação: protocolo encapsulado na skill `operate-planning-board` (carregada pelos três) e o determinístico num script, não em prosa interpretável.
- **Enforcement mecânico fragmentado por harness:** `permissions.deny` (Claude), sandbox (Codex) e firewall (Copilot) têm formatos distintos — três configs que podem divergir. Mitigação: a **remoção de capability** é a defesa primária por ser portável (uma credencial inalcançável não vaza em harness nenhum); as deny-lists são defesa em profundidade.
- **Portão de merge antes do CI completo:** a branch protection (exigir PR + sem push direto, required-approvals=0) é ligada **agora**, desacoplada do CI do M0.2 (`pr-checks.yml` depende do esqueleto das apps, que é M0.3). Assim o merge é gated por construção desde o início; o CI entra depois e endurece o que hoje é revisão humana manual. (O operador optou por **não** sequenciar o M0.2 completo antes do board; a branch protection isolada é o mínimo que torna o portão real.)
- Risco de over-engineering: tentar o harness autônomo completo agora, para ~14 tarefas, não se paga. Mitigação: começar pelo loop mínimo (descobre → executa → atualiza → você observa) e só automatizar ao sentir dor.

### Critério de reversão e trip-wires

Se ao fim da Fase 0 o board tiver sido mais escrituração que valor, ou tiver divergido da realidade, simplificar ou descontinuar. Manter a reversão barata é o que separa experimento de dívida cerimonial.

Gatilhos concretos derivados no refinamento:

- **Adotar delegação nativa** (Copilot / `claude-code-action`) quando o hand-roll parar de ensinar modo de falha novo **ou** a toil de GraphQL exceder o aprendizado.
- **Endurecer a colisão** (de assignee+releitura para um mutex externo) só quando uma colisão real ocorrer — ex.: Copilot assíncrono em paralelo a uma sessão local.
- **Reverter/simplificar o board** se virar escrituração > valor.

## Opções rejeitadas

- **Só `ROADMAP.md` (status quo):** suficiente para backlog minúsculo de solo, mas não constrói a capacidade de harness nem serve a vitrine da VISION.
- **Board como fonte de tudo (specs incluídas):** decisões e specs ficariam fora do git e dos portões — ungated e não versionado.
- **`ROADMAP.md` como fonte, board como espelho gerado:** custo de motor de sync, PR por tique de status, lugar visual derivado não-confiável como verdade ao vivo.
- **Ferramenta externa (Linear/Jira):** mais um lar fora do repo, overkill para solo, sai do GitHub-native.
- **GitHub Wiki:** rejeitado em análise separada (fonte única, SEO, invisível aos agentes).

---

## Apêndice operacional (executar **após** aprovação deste ADR)

> Pré-requisito: `gh auth refresh -s project` (escopo `project` no token). Verifique as opções do campo `Status` default com `gh project field-list <n> --owner ThiagoPanini` antes de ajustar.

### A. Taxonomia de labels

```bash
# Fases
for p in 0 1 2 3 4; do gh label create "phase-$p" --color 1d76db --description "Fase $p"; done
gh label create someday --color cfd3d7 --description "Fora da fase corrente; backlog congelado"

# Scope (espelha o regex de branches do ADR-0005)
gh label create infra --color 0e8a16 --description "Infra e borda"
gh label create ci    --color 0e8a16 --description "CI/CD e qualidade"
gh label create web   --color 0e8a16 --description "apps/web (Next.js)"
gh label create api   --color 0e8a16 --description "apps/api (FastAPI)"
gh label create docs  --color 0e8a16 --description "Documentação versionada"
# (catalog, identity, engagement, narration, shared, platform criados quando a Fase 1 começar)

# Curadoria
gh label create proposed --color fbca04 --description "Proposta por agente; aguarda triagem humana"
```

### B. Project + campos + views

```bash
# Criar o project (user-scoped)
gh project create --owner ThiagoPanini --title "talkingpres — roadmap"
# Anotar o número retornado como <N>

# Campos custom (Status já existe por default — ajustar opções p/ Backlog/Todo/In progress/In review/Done/Blocked)
gh project field-create <N> --owner ThiagoPanini --name "Phase" \
  --data-type SINGLE_SELECT --single-select-options "0,1,2,3,4"
gh project field-create <N> --owner ThiagoPanini --name "Owner" \
  --data-type SINGLE_SELECT --single-select-options "Human,Agent,Pairing"
gh project field-create <N> --owner ThiagoPanini --name "Priority" \
  --data-type SINGLE_SELECT --single-select-options "P0,P1,P2"

# Views (via UI): "Board" (kanban por Status), "Roadmap" (timeline por Phase), "Minha fila" (filtro Owner=Human)
# Automações built-in (via UI): item adicionado → Todo; issue fechada → Done; PR mergeado → Done
```

### C. Corpus de issues da Fase 0

Criar uma issue por linha (corpo seguindo o template Contexto / Critério de aceite / Notas para o agente / Dependências):

| Título | Labels | Owner | Marco |
|---|---|---|---|
| trocar nameservers p/ Cloudflare e ativar zona `talkingpres.com` | `phase-0,infra` | Human | M0.1 |
| publicar Coolify em subdomínio proxied, TLS Full strict | `phase-0,infra` | Pairing | M0.1 |
| criar admin do Coolify (senha no gerenciador de segredos) | `phase-0,infra` | Human | M0.1 |
| fechar a origem: UFW ranges Cloudflare + fechar 8000/6001/6002 + validação externa tripla | `phase-0,infra` | Pairing | M0.1 |
| backup Postgres em R2 (credencial S3 + schedule Coolify) | `phase-0,infra` | Pairing | M0.1 |
| runbook de restore mensal do Postgres | `phase-0,docs` | Agent | M0.1 |
| deploy "hello world" em produção em `talkingpres.com` | `phase-0,infra` | Pairing | M0.1 |
| workflow `pr-checks.yml` (lint+typecheck+test) | `phase-0,ci` | Agent | M0.2 |
| branch protection / ruleset na `main` (exigir PR, sem push direto — **portão de merge**) | `phase-0,ci` | Human | **M0.0 (bootstrap, antes do board operar)** |
| criar skill `operate-planning-board` (SKILL.md + `scripts/` claim/submit/block) | `phase-0,ci` | Pairing | **M0.0 (bootstrap)** |
| gating por harness (deny/sandbox Claude/Codex/Copilot) + capability removal das credenciais catastróficas | `phase-0,ci` | Human | **M0.0 (bootstrap)** |
| secret scanning `gitleaks` no CI | `phase-0,ci` | Agent | M0.2 |
| skeleton `apps/web` (Next.js hello world) | `phase-0,web` | Agent | M0.3 |
| skeleton `apps/api` (FastAPI hello world) | `phase-0,api` | Agent | M0.3 |
| docker compose local com Postgres | `phase-0,infra` | Agent | M0.3 |
| `CONTRIBUTING.md` + `CODE_OF_CONDUCT.md` + `SECURITY.md` | `phase-0,docs` | Agent | M0.4 |

### D. `ROADMAP.md` — **não** reescrever ainda; forma-alvo para o fim da Fase 0

> **Revisto no refinamento (2026-05-27):** esvaziar o `ROADMAP.md` **antes** de o board provar valor torna a reversão cara (o plano granular passaria a viver só no DB do GitHub). **Mantenha os checkboxes granulares** como plano versionado enquanto o board é experimento; o board é a *view ao vivo* (filtro `phase-0`) e o ROADMAP **linka** essa view em vez de duplicar status por tarefa. O bloco abaixo é a **forma-alvo**, a adotar **se** o board provar valor ao fim da Fase 0 — não uma ação imediata.

```markdown
## Fase 0 — Fundação

Sem código de produto. Objetivo: base sólida de documentação, infra,
automação e setup AI-first.

**Critério de saída (DoD da fase):** deploy "hello world" respondendo em
`talkingpres.com` atrás da Cloudflare · CI verde obrigatório em PR ·
skeleton do monorepo rodando local.

**Acompanhamento ao vivo:** board do projeto → filtro `phase-0`.

| Marco | Foco | Status |
|---|---|---|
| M0.1 | Infra e borda (Cloudflare, backup, deploy hello world) | em andamento |
| M0.2 | CI/CD e qualidade (pr-checks, branch protection, gitleaks) | a iniciar |
| M0.3 | Skeleton monorepo + ambiente local | a iniciar |
| M0.4 | Docs de comunidade (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY) | a iniciar |
```

> Itens já concluídos (VPS, hardening, Coolify, ADRs, taxonomia de docs) viram **issues fechadas** — a história fica preservada no grafo, não numa lista de checkboxes paralela.
