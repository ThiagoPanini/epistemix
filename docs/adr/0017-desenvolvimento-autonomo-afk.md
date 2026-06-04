# ADR 0017 — Desenvolvimento autônomo (AFK): HITL nas bordas, AFK no meio

- **Status:** Accepted
- **Data:** 2026-06-04
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** estende [ADR-0014](0014-roadmap-como-source-skill-solo-dev-assistant.md) (planejamento) e [ADR-0005](0005-deploy-checks-em-tres-portoes.md) (portões de deploy) **sem contradizê-los**; consome os MCPs configurados em [ADR-0003](0003-infra-hostinger-vps-coolify.md)/[ADR-0006](0006-cloudflare-na-frente-da-vps.md)/[ADR-0016](0016-vps-agnostica-multi-projeto.md) (guides [0004](../guides/0004-configurar-hostinger-vps-mcp.md)–[0006](../guides/0006-configurar-cloudflare-mcp.md)); herda o princípio de autonomia da [lesson 0002](../lessons/0002-harness-basico-em-github-projects.md)

## Contexto

Os MCP servers de Hostinger (VPS), Coolify e Cloudflare foram configurados (guides 0004–0006) com o objetivo declarado de **dar autonomia operacional aos agentes** — executar tarefas que antes dependiam de interação manual do operador.

Isso cria uma capacidade nova e perigosa ao mesmo tempo: o agente agora consegue **tocar produção e infra** — fazer deploy, mudar DNS, mexer no firewall que fecha a origem, destruir ou recriar a VM. Sem uma política explícita, "mais autonomia" vira "mais blast radius". Os documentos embutidos nas sessões de agente (AGENTS.md, CONTEXT.md, ADRs) não diziam, até este ADR, **o que um agente pode tocar sozinho e o que precisa parar e chamar o humano**.

Em paralelo, o operador quer adotar o fluxo **AFK (Away From Keyboard)** descrito por Matt Pocock para o desenvolvimento de features: o trabalho se divide em tarefas **HITL** (*human in the loop* — exigem julgamento humano) e **AFK** (o agente implementa sozinho). O bom desenho é **HITL nas bordas, AFK no meio**: o humano alinha o que construir (borda de entrada), o agente implementa sem supervisão (meio), o humano revisa e mergeia (borda de saída).

O [ADR-0014](0014-roadmap-como-source-skill-solo-dev-assistant.md) **já encoda o eixo certo** — "agente livre no reversível, humano gated no irreversível (merge, segredos, produção)". O que falta é tornar esse eixo **operacional** para as duas superfícies novas (ops via MCP e feature-dev) e escrever isso onde o agente lê (AGENTS.md).

## Decisão

Adotar um **modelo único de autonomia — "HITL nas bordas, AFK no meio"** — governado pelo eixo **reversibilidade × blast radius**, instanciado em duas superfícies: **ops via MCP** e **feature-dev**.

Princípio raiz (uma frase): **reversível e de baixo impacto → o agente faz; irreversível, destrutivo ou que toca produção de forma não-recuperável → o humano decide.** Na dúvida sobre em que faixa uma operação cai, trate como vermelho.

### 1. Autonomia em ops via MCP — semáforo 🟢🟡🔴

Classifique **pelo efeito da operação, não decorando a lista de tools** (os catálogos dos MCPs mudam; o critério não). Os exemplos abaixo são representativos, não exaustivos.

| Faixa | Regra | O agente | Exemplos (Hostinger / Coolify / Cloudflare) |
|---|---|---|---|
| 🟢 **Verde** | Leitura e diagnóstico. Sem efeito colateral. | Faz **sempre**, sozinho, sem anunciar. | `get*`/`list*`/`*Details*`/`*Metrics*`/`*Logs*`, `getBackups`, `getSnapshot` · `list_*`/`get_*`/`*_logs`/`diagnose_*`/`find_issues`/`get_infrastructure_overview`/`search_docs`/`server_resources`/`validate_server` · reads e `search` (observabilidade, listar zonas/registros/buckets) |
| 🟡 **Amarelo** | Efeito **reversível e observável**. Não destrói dado nem fecha acesso. | Faz sozinho, **mas registra em [docs/ai-ops/](../ai-ops/)** o que fez e por quê (vide §4). | criar snapshot, post-install script, public key, projeto de container; start/stop/restart de um app/projeto existente · `deploy`/`redeploy`/`restart` de app existente, `env_vars`/`bulk_env_update` **não-secretas**, criar application/service/database, `scheduled_tasks`, `storages` · purge de cache |
| 🔴 **Vermelho** | **Irreversível, destrutivo, mexe em segredo, ou afeta produção de forma não-recuperável.** | **Propõe e para.** Prepara tudo, descreve o comando exato, e aguarda o operador executar (ou confirmar). | mudar DNS/nameservers/PTR, qualquer operação de firewall (create/update/delete/activate/deactivate/sync), recriar/comprar/destruir VM, restaurar backup/snapshot por cima, mudar senha (root/panel), `delete*` de recurso, recovery mode, hostname · `stop_all_apps`, drop/delete de database ou app com dado, `cloud_tokens`/`private_keys` (segredos) · criar/editar/deletar registro DNS, regra WAF/firewall, configuração de zona, deletar bucket R2 |

Regras de borda:

- **Segredos (🔴) seguem o protocolo de operação sensível:** o agente faz toda a parte sem segredo, **documenta o comando** que toca o segredo, e entrega para o operador aplicar — não trava a sessão nem tenta forçar (consistente com a prática registrada do operador).
- **O caminho normal para produção continua sendo `merge → deploy` ([ADR-0005](0005-deploy-checks-em-tres-portoes.md) portão 3), gated por merge humano.** Um `redeploy`/`restart` manual via Coolify MCP é ação de **ops** (recuperação, aplicar env var), reversível e com rollback por health-check — por isso 🟡, não 🔴.
- **Na dúvida, 🔴.** É sempre seguro o agente perguntar; não é seguro o agente adivinhar para baixo.

### 2. Autonomia em feature-dev — o fluxo AFK

A unidade de trabalho autônomo é a **vertical slice**, não a feature inteira.

> **Vertical slice (tracer bullet):** incremento fino que atravessa **todas as camadas** (schema → API → UI → testes → e2e), entregável e verificável sozinho. O oposto de "fatiar horizontalmente" (fazer todo o schema, depois toda a API…), que é o modo de falha que tira um agente AFK dos trilhos.

Pipeline — **HITL nas bordas, AFK no meio**:

1. **🔴 HITL — alinhar (borda de entrada).** O operador alinha o *que* construir com o agente via `grill-me`/`grill-with-docs`, resolvendo ambiguidade. Julgamento mora aqui.
2. **🟡 Handoff — PRD-lite.** O agente destila o alinhamento num spec curto em `docs/specs/NNNN-<feature>.md`: objetivo, critério de aceite, e a **lista de vertical slices**. Reversível → o agente cria sozinho. Ver §5.
3. **🟢/🟡 AFK — implementar (meio).** Para cada slice, o agente trabalha **sem supervisão** num **git worktree** (§3): implementa a fatia ponta-a-ponta com TDD, roda os feedback loops (testes, typecheck, lint) até **PR verde** (CI passando). Pode encadear slices consecutivas como PRs separados. **Não mergeia.**
4. **🔴 HITL — revisar e mergear (borda de saída).** O operador revisa o diff, confere o resultado e mergeia. Merge permanece humano ([ADR-0005](0005-deploy-checks-em-tres-portoes.md) intacto). Merge na `main` dispara deploy.

**Pré-condição de execução (trip-wire):** o AFK de feature só roda de verdade quando a **Fase 0 estiver fechada** — sem skeleton (`apps/web`, `apps/api`), CI (`pr-checks.yml`), Lefthook e branch protection, o loop **não tem portão real para se auto-verificar**. Até lá, este fluxo está **documentado mas não executável**.

### 3. Sandbox: worktree por padrão para runs AFK

Todo run AFK de implementação acontece num **git worktree dedicado** (o harness suporta `isolation: worktree`), nunca na árvore de trabalho principal. Isso limita o blast radius no código e habilita paralelismo. Trabalho paralelo é **particionado por boundary** ([ADR-0001](0001-monorepo-and-boundaries.md)) — um worktree por boundary — para evitar conflito. O sandbox é o substrato de segurança que torna o AFK seguro de verdade no lado do código (o equivalente, em ops, é o semáforo da §1).

### 4. Diário de ops: 🟡 registra em `docs/ai-ops/`

Operações 🟡 executadas por agente são anotadas em [docs/ai-ops/](../ai-ops/) — a trilha auditável que já existe para operações de infra. Não é um log novo: é o mesmo gênero, agora também alimentado por ações autônomas. Mantém a propriedade de que **toda mudança de estado de infra é rastreável**, mesmo quando feita sem o operador olhando.

### 5. Convenção `docs/specs/` — PRD-lite versionado

Specs de feature vivem em `docs/specs/NNNN-<feature>.md` — gênero leve, in-repo, versionado e **cross-harness** (lido idêntico por Claude, Codex, Copilot). Preferido a issues do GitHub porque o operador "dificilmente cria issue manual" ([ADR-0014](0014-roadmap-como-source-skill-solo-dev-assistant.md)) e issue não é versionada nem portável entre harnesses. O gênero é **semeado agora** (README + critério), mas o **primeiro spec nasce lazy**, quando a primeira feature da Fase 1 começar.

Distinção de gêneros: um **ADR** registra uma *decisão* e o *porquê*; um **spec** registra *o que construir* + critério de aceite + plano de slices. São coisas diferentes — Matt separa explicitamente `/to-prd` (destino) de decisões arquiteturais.

### 6. Tooling do loop — `to-prd` adotado cedo; resto deferido (trip-wire)

A skill `to-prd` (a ferramenta de *destino/PRD* do fluxo) foi adotada antecipadamente (commit `f179991`), antes do gatilho de dor previsto. É aceitável, mas com duas ressalvas registradas:

- **A versão importada publica o PRD num issue tracker e aplica label `ready-for-agent`** — o que contradiz este ADR (PRD-lite mora em `docs/specs/`, §5) e o [ADR-0014](0014-roadmap-como-source-skill-solo-dev-assistant.md) (issues deferidas). Antes de usar `to-prd` no fluxo do epistemix, **adaptá-la para escrever em `docs/specs/NNNN-<feature>.md`**, não em issue. Até a adaptação, tratar a skill como **não-wired**.
- **As skills afins do mesmo conjunto (`to-issues`, que fatia em slices) carregam a mesma ressalva de issue tracker** — adaptar antes de usar. **O loop completo (tipo "Ralph") permanece deferido** pelas razões originais: (a) execução bloqueada até a Fase 0 fechar (§2); (b) o ADR-0014 prega "comando puxado por dor, não por catálogo a priori". Quando construído, o lar natural é um comando da skill `solo-dev-assistant`, não uma skill paralela.

## Justificativa

- **Autonomia máxima com cinto de segurança fino.** 🟢+🟡 já é "quase tudo" — o agente lê, cria, faz deploy, redeploya, diagnostica e conserta sozinho. 🔴 é só a lista curta do que não dá pra desfazer. Isso entrega a maior autonomia possível sem risco de um agente sozinho brickar a VPS ou apagar produção enquanto o operador dorme.
- **Classificar pelo efeito, não pela tool, não enferruja.** Os catálogos de MCP crescem e mudam; o critério reversibilidade × blast radius vale para qualquer tool nova sem reescrever este ADR.
- **Vertical slicing é o insight que mantém o AFK nos trilhos.** Fatias finas dão feedback loop instantâneo por tarefa e impedem o agente de "codar horizontalmente" sem nunca fechar nada.
- **Estende, não reescreve.** O eixo de autonomia já estava no ADR-0014; os portões de merge no ADR-0005; a trilha de ops em docs/ai-ops; o particionamento por boundary no ADR-0001. Este ADR conecta peças existentes para as superfícies novas, em vez de inventar processo.
- **Leveza preservada.** Nenhum artefato obrigatório novo no fluxo padrão (specs são lazy; o diário 🟡 reusa ai-ops; o tooling do loop é deferido). Coerente com a filosofia do ADR-0014.

## Consequências

### Positivas

- Um agente novo que abre o repo lê AGENTS.md + este ADR e sabe, **sem perguntar**, o que pode tocar sozinho nos MCPs e como atacar uma feature em fatias verticais até PR verde.
- Blast radius de ops autônoma fica contido por construção; o operador pode deixar o agente trabalhar AFK com confiança calibrada.
- Trilha auditável mantida (🟡 → ai-ops; transições de estado → git).
- O caminho para o tooling do loop está desenhado, sem custo de construí-lo antes da hora.

### Negativas

- **Classificação por efeito exige julgamento do agente** numa zona cinza (ex.: "isso conta como destrutivo?"). Mitigado pela regra "na dúvida, 🔴" — erra para o lado seguro, ao custo de algumas perguntas a mais.
- **Assimetria de produção em 🟡.** Um `redeploy` autônomo toca o site live; depende do rollback por health-check do Coolify funcionar. Se um deploy ruim passar pelo health-check, o operador descobre depois (mitigado pelo registro em ai-ops).
- **Specs lazy podem nunca nascer** se o operador pular a etapa de PRD-lite e mandar o agente direto. É um risco de disciplina, não de desenho.
- **Workflow documentado mas não executável** até a Fase 0 fechar — há um intervalo entre escrever este ADR e poder exercê-lo.

### Trip-wires (gatilhos de revisão)

- **Fase 0 fecha** (skeleton + CI + Lefthook + branch protection) → o AFK de feature vira executável; construir o tooling do loop puxado pela primeira fricção real.
- **Zona cinza do semáforo dói** (agente erra classificação de forma recorrente) → mover a operação ambígua explicitamente para 🔴 e listar a exceção no AGENTS.md.
- **`redeploy` autônomo causa incidente** → rebaixar deploy/redeploy de produção para 🔴 (vira o "carve-out de produção" — qualquer coisa que toque app live exige humano).
- **Operador deixa de ser solo** → reabrir o modelo (autonomia compartilhada muda o cálculo de blast radius).

## Opções rejeitadas

- **Corte binário puro (reversível/irreversível), como no ADR-0014 cru.** Trata `redeploy` de produção como AFK pleno; subestima blast radius em ops. O semáforo adiciona a faixa 🟡 (faz + registra) exatamente para esse meio.
- **Merge autônomo pelo agente** (como no AFK "puro" do Matt, onde tarefas AFK mergeiam sozinhas). Rejeitado: contradiz o portão de merge humano do ADR-0005, e em projeto open-source solo o review humano na ponta é barato e vale o seguro. AFK aqui é "implementar até PR verde", não "mergear".
- **Construir o Ralph loop / `/to-issues` agora.** Sem Fase 0 fechada não há portão para o loop se verificar; ADR-0014 manda esperar a dor. Deferido com trip-wire.
- **PRD-lite como issue do GitHub.** Não é versionado nem cross-harness; o operador raramente cria issue manual. `docs/specs/` vence.
- **Não escrever política de MCP e confiar no bom senso do agente.** É exatamente o que cria blast radius silencioso. A política explícita é o ponto.

## O que este ADR NÃO muda

- Portões de deploy ([ADR-0005](0005-deploy-checks-em-tres-portoes.md)): merge humano, três portões, CI como gate real — intactos.
- Substrato de planejamento ([ADR-0014](0014-roadmap-como-source-skill-solo-dev-assistant.md)): ROADMAP single source, intent-loop, hook de auto-commit — intactos. Este ADR adiciona uma superfície (feature-dev/specs) ao mesmo eixo de autonomia.
- Boundaries de domínio ([ADR-0001](0001-monorepo-and-boundaries.md)) e arquitetura hexagonal ([ADR-0004](0004-hexagonal-pragmatica.md)) — intactos.
- A escolha de infra ([ADR-0003](0003-infra-hostinger-vps-coolify.md)/[ADR-0006](0006-cloudflare-na-frente-da-vps.md)/[ADR-0016](0016-vps-agnostica-multi-projeto.md)) — intacta; este ADR governa *como* os agentes a operam, não *o que* ela é.
