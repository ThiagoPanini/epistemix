---
numero: 0002
titulo: Harness básico de planejamento sobre um board de issues — partição, autonomia assimétrica e os modos de falha de uma máquina de estados operada por agentes
data: 2026-05-27
versao: 1.0
validade: revalidar em 2027-05, ou quando a UI/API de automações do board mudar de superfície; afirmações específicas pressupõem GitHub Projects v2 e gh CLI ≥ 2.50 (2024+)
tags: [agents, planning-harness, project-management, state-machine, source-of-truth, automation]
publico_alvo: desenvolvedores que já usam issues, PRs e CI, e querem entender como desenhar um sistema de planejamento que agentes de IA operam sozinhos sem corromper a própria fonte de decisão
tldr: Um board operado por agentes só é confiável se cada informação tem um lar único (partição, não duplicação), se a autonomia é assimétrica (agente livre no reversível, humano no irreversível), e se você sabe que regra escrita em prosa não é enforcement. A máquina de estados tem modos de falha próprios — claims órfãos, espelhos divergentes, spec sem portão — e desenhá-la é antecipá-los.
---

# Lição 0002 — Harness básico de planejamento sobre um board de issues: o board não decide nada irreversível, e é por isso que o agente pode escrever nele

> Aula sobre os princípios de desenhar um harness de planejamento que agentes de IA operam de forma autônoma, usando um board de issues (tipo GitHub Projects) como substrato. Não é receita executável — para montar o board passo a passo, veja um [guide](../guides/); para os comandos do dia a dia, um [runbook](../runbooks/). É o raciocínio por trás do desenho: por que partição vence duplicação, por que a autonomia precisa ser assimétrica, por que regra em prosa não é enforcement, e quais são os modos de falha da máquina de estados. Aplicações concretas a este projeto estão no [apêndice](#apêndice--aplicações-documentadas).

## Objetivos de aprendizagem

Ao terminar esta lição, você será capaz de:

1. **Explicar** por que duplicar informação entre dois lares (um doc versionado e um board ao vivo) produz divergência contínua, e por que partição por altitude elimina a classe inteira de bug por construção.
2. **Justificar** o desenho de autonomia assimétrica — agente livre nos pontos reversíveis, humano no loop nos irreversíveis — articulando o que torna uma ação "irreversível o suficiente" para merecer um portão.
3. **Distinguir** o que um board moderno faz built-in do que exige automação escrita, e decidir quando aceitar uma transição manual em vez de construir o motor que a automatiza.
4. **Identificar** por que enforcement por prosa (uma regra escrita num arquivo que o agente lê) é mais frágil que enforcement por construção, e onde cada um é o certo.
5. **Comparar** os modos de falha de uma máquina de estados operada por agentes — claim órfão, espelho divergente, spec sem portão — e mapear cada um à decisão de desenho que o previne.
6. **Decidir** quando vale construir o harness completo agora versus começar pelo loop mínimo e só automatizar ao sentir dor.

## Pré-requisitos assumidos

Esta lição assume familiaridade com:

- **Issues e pull requests** — o que são, o ciclo de abrir/revisar/fechar, e a noção de que um PR pode fechar uma issue ao ser mergeado.
- **CI / portões de merge** — a ideia de que checks automáticos (lint, teste) rodam antes do merge e que `main` pode ser protegida.
- **O que é um agente de IA** que executa tarefas (lê instruções, roda comandos, abre PRs), sem precisar saber como ele funciona por dentro.
- **Controle de versão (git)** — commit, branch, merge, e a noção de que o histórico é imutável e auditável.

Não assume: experiência prévia desenhando sistemas multi-agente, conhecimento de GraphQL ou de qualquer API específica de board, nem familiaridade com teoria de máquinas de estado. Os termos técnicos são definidos inline na primeira ocorrência e revisitados no [glossário](#glossário).

Se "portão de merge" ou "CI obrigatório em PR" é novo para você, recomendamos ler antes uma introdução a fluxo de trabalho baseado em pull request (o [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) é uma boa porta de entrada, gratuita).

## Versão e validade

| Atributo | Valor |
|---|---|
| Versão | 1.0 |
| Data | 2026-05-27 |
| Substrato de referência | GitHub Projects v2 (o raciocínio vale para qualquer board com API e automações built-in) |
| Ferramenta CLI alvo | `gh` ≥ 2.50 (comando `gh project`, 2024+) |
| API alvo | GraphQL (mutações de campo do board não têm equivalente REST estável) |
| Revalidação sugerida | 2027-05, ou quando a UI/API de automações do board ganhar gatilhos novos |
| O que envelhece mais rápido | a lista exata de automações built-in, a superfície do `gh project`, e o que é GraphQL-only vs CLI-coberto |

## Índice

1. [O problema não é organizar trabalho — é ter um agente que decide a partir de dados](#o-problema-não-é-organizar-trabalho--é-ter-um-agente-que-decide-a-partir-de-dados)
2. [Partição vence duplicação porque dois escritores em duas cópias sempre divergem](#partição-vence-duplicação-porque-dois-escritores-em-duas-cópias-sempre-divergem)
3. [Status é estado efêmero, não conhecimento — e isso decide quem é a fonte](#status-é-estado-efêmero-não-conhecimento--e-isso-decide-quem-é-a-fonte)
4. [Autonomia assimétrica: o agente é livre exatamente onde nada irreversível acontece](#autonomia-assimétrica-o-agente-é-livre-exatamente-onde-nada-irreversível-acontece)
5. [O que o board faz sozinho e o que você vai ter que escrever](#o-que-o-board-faz-sozinho-e-o-que-você-vai-ter-que-escrever)
6. [Regra em prosa não é enforcement — é convenção que sobrevive enquanto for lida](#regra-em-prosa-não-é-enforcement--é-convenção-que-sobrevive-enquanto-for-lida)
7. [A máquina de estados e seus três modos de falha](#a-máquina-de-estados-e-seus-três-modos-de-falha)
8. [Colisão multi-agente: quando releitura basta e quando você precisa de um lock](#colisão-multi-agente-quando-releitura-basta-e-quando-você-precisa-de-um-lock)
9. [Comece pelo loop mínimo, automatize só ao sentir dor](#comece-pelo-loop-mínimo-automatize-só-ao-sentir-dor)
10. [Limites desta lição](#limites-desta-lição)
11. [Leitura adicional](#leitura-adicional)
12. [Glossário](#glossário)
13. [Apêndice — Aplicações documentadas](#apêndice--aplicações-documentadas)

---

## O problema não é organizar trabalho — é ter um agente que decide a partir de dados

Quando uma pessoa olha um quadro de tarefas levemente desatualizado, ela compensa. Vê um card em "fazendo" que na verdade já acabou, dá de ombros, sabe que o Fulano esqueceu de mover. O cérebro humano trata o board como uma dica, não como verdade — e reconcilia com o que sabe por fora.

Um agente de IA não tem esse "por fora". Quando um agente decide o que fazer a seguir lendo o board, o board **é** a realidade dele. Se o card diz `Todo` e na verdade outro agente já está mexendo, o nosso agente vai reivindicar trabalho já reivindicado. Se a especificação que ele lê está numa cópia desatualizada, ele vai construir a coisa errada — e com confiança, porque para ele o dado era a verdade. A diferença entre um quadro de tarefas humano e um substrato operado por agentes é essa: **o board deixa de ser um lembrete e vira input de decisão**. E input de decisão errado não é inconveniência; é a fábrica de fazer a coisa errada certa.

É por isso que desenhar um harness de planejamento — o conjunto de regras, estados e fronteiras que governam como agentes descobrem, reivindicam, executam e reportam trabalho — não é um problema de organização. É um problema de **integridade de dados sob dois escritores**: o humano e o agente escrevendo no mesmo sistema, em ritmos diferentes, com consequências diferentes.

> 💡 **Princípio — o board é input de decisão, não lembrete**
>
> Tudo o que se segue deriva disto: se um agente decide a partir de um dado, esse dado precisa ser não-ambíguo por construção, não por disciplina. "A gente mantém sincronizado no olho" é uma frase que funciona com leitores humanos e quebra com escritores automáticos.

### Diagrama mental: harness operado por agentes

```text
        ┌──────────────────────────────────────────────┐
        │                  HARNESS                       │
        │  (regras + estados + fronteiras de autonomia)  │
        └──────────────────────────────────────────────┘
                 │                          │
        escreve  │                          │  escreve
        (livre)  ▼                          ▼  (gated)
        ┌──────────────┐            ┌──────────────────┐
        │    AGENTE     │            │     HUMANO        │
        │ descobre →    │            │ cura backlog →    │
        │ reivindica →  │            │ aprova merge →    │
        │ executa →     │            │ guarda segredos   │
        │ reporta       │            │                   │
        └──────┬───────┘            └────────┬──────────┘
               │                             │
               ▼                             ▼
        ┌────────────────────────────────────────────┐
        │   BOARD (estado ao vivo) + ISSUES (spec)     │
        │   + PRs (código, passa pelos portões)        │
        └────────────────────────────────────────────┘
```

Repare que há dois escritores e três tipos de coisa sendo escrita: estado ao vivo, especificação e código. O desenho inteiro do harness é decidir **onde cada coisa mora** e **quem pode mexer em quê sem pedir licença**. As próximas duas seções atacam essas duas perguntas.

---

## Partição vence duplicação porque dois escritores em duas cópias sempre divergem

Existe uma tentação natural ao montar o board: manter o documento de planejamento que você já tem (um `ROADMAP.md`, uma planilha, um doc) **e** espelhar o mesmo conteúdo no board, para ter "o visual bonito" além do texto. Isso é **duplicação**: a mesma informação em dois lares. E duplicação, com dois escritores, não é trabalho de sincronização ocasional — é divergência contínua.

A aritmética é simples. Se a informação X vive em dois lugares e qualquer um dos dois escritores pode mudar X, então a cada escrita de um lado abre-se uma janela em que os dois lados discordam. Com escritores humanos disciplinados e baixa frequência, a janela é pequena e some no próximo sync manual. Com um agente reportando progresso a cada tique, a janela nunca fecha — e, pior, o agente lê de uma das cópias para decidir. Você não tem um problema de "às vezes está desatualizado"; você tem um gerador permanente de decisões a partir de dado velho.

A saída não é "sincronizar melhor". É **partição**: dar a cada informação exatamente um lar, e fazer lares diferentes guardarem coisas de **altitudes diferentes**, de modo que não possam descrever a mesma coisa. Se um lar fala de *estratégia e marcos* e outro fala de *tarefas granulares*, eles não têm como divergir — porque não falam da mesma coisa. Divergência exige sobreposição; partição remove a sobreposição.

> 💡 **Princípio — partição por altitude**
>
> Não pergunte "como mantenho as duas cópias iguais?". Pergunte "como faço para que não existam duas cópias?". A resposta é dar a cada fato um único lar e separar lares por altitude (estratégia vs. tarefa vs. estado vs. projeção), de modo que dois lares nunca afirmem o mesmo fato.

### Como fica a partição na prática

Um desenho de partição típico para um harness sobre board de issues separa quatro altitudes:

| Informação | Lar único | Por quê esse lar |
|---|---|---|
| Estratégia e marcos de fase | Documento versionado (ex. `ROADMAP.md`) | É narrativa e "porquê"; muda devagar; merece histórico em git |
| Especificação da tarefa granular | **Corpo da issue** | Está no grafo, é linkável, notifica quem segue ao mudar |
| Status e progresso ao vivo | **Campos do board** | Estado operacional efêmero; o agente escreve livremente |
| Visão consolidada para consulta | **View do board** (roadmap/timeline) | É uma **projeção** das issues — lê delas, ninguém edita à mão |

A consequência que costuma surpreender: o documento de estratégia **deixa de listar tarefas granulares**. Os checkboxes viram issues. O documento volta a falar só de marcos. Como o documento fala de marcos e o board fala de tarefas, a divergência some — não porque alguém é disciplinado, mas porque não há mais o mesmo fato em dois lugares.

> ⚠️ **Armadilha — o espelho que parece inofensivo**
>
> "Vou só deixar uma listinha das tarefas no doc também, pra referência rápida." Essa listinha é uma segunda cópia da spec que agora mora nas issues.
>
> **Sintoma:** semanas depois, o doc lista 14 tarefas, o board tem 17, três estão em estados que o doc não reflete, e um agente que leu o doc reivindicou algo que já estava `Done`.
>
> **Resolução:** a "referência rápida" no doc deve ser um *link* para uma view do board com filtro, nunca uma cópia do conteúdo. Projeção, não duplicata.

> 🎯 **Teste rápido**
>
> **Pergunta:** Por que separar os lares "por altitude" (marcos vs. tarefas) elimina divergência, enquanto "sincronizar com cuidado" não?
>
> <details>
> <summary>Resposta</summary>
> Porque divergência só é possível quando dois lares afirmam o mesmo fato. Separar por altitude garante que nenhum fato esteja em dois lugares: o doc afirma "o marco M1 está em andamento", o board afirma "a tarefa T está em review". São fatos diferentes, de níveis diferentes — não há o que sincronizar nem como discordar. "Sincronizar com cuidado" mantém o mesmo fato em dois lugares e só reduz a frequência da divergência, não a possibilidade. Veja [partição por altitude](#partição-vence-duplicação-porque-dois-escritores-em-duas-cópias-sempre-divergem).
> </details>

---

## Status é estado efêmero, não conhecimento — e isso decide quem é a fonte

Decidida a partição, sobra uma pergunta que parece técnica mas é conceitual: quando o documento e o board guardam coisas relacionadas, **quem é a fonte de qual coisa**? Em particular: o status de uma tarefa (`Todo`, `In progress`, `Done`) — ele vive no git, versionado, e o board é um espelho? Ou ele vive no board, e o git nunca o vê?

A resposta cai fora de uma distinção que vale para muito além de boards: **estado efêmero vs. conhecimento**. Conhecimento é o que você quer poder reconstruir, auditar, culpar e reverter — a decisão de arquitetura, a especificação da feature, o código. Isso merece git: histórico imutável, revisão, portões. Estado efêmero é a posição atual de algo que muda o tempo todo e cujo valor é "qual é agora", não "qual foi em cada instante" — o card está em review *agora*. Versionar isso em git é cerimônia sem retorno: um commit por tique de status, um PR para mover um card, ruído puro no histórico.

> 💡 **Princípio — versione conhecimento, não estado**
>
> Pergunte de cada dado: "quero poder reverter isto e ser cobrado por cada mudança?". Se sim, é conhecimento — vive no git e passa pelos portões. Se o que importa é só o valor atual e ele muda o tempo todo, é estado efêmero — vive no board, escrito livremente.

Isso resolve a direção da fonte. Fazer o documento ser a fonte e o board um espelho gerado custa caro e entrega pouco: exige construir um motor de sincronização agora, força o agente a abrir um PR a cada mudança de status (pesadíssimo), e transforma o lugar visual num derivado em que ninguém confia como atual. A direção que se paga é a inversa — **o board é a fonte do status, e nada de status vai para o git**. O que merece versionamento (a spec nas issues, o código e as decisões nos PRs) continua versionado e continua passando pelos portões de merge. Só o estado é livre.

Há um preço honesto nessa escolha, e vale dizê-lo: o status passa a viver no banco de dados do provedor do board, não no seu git. Não é versionado e não é portável se você sair daquela plataforma. Para estado efêmero, isso é aceitável — você não chora por não ter o histórico de cada vez que um card mudou de coluna. Mas é um trade-off real, não um almoço grátis, e quem desenha precisa assumi-lo conscientemente.

> 🎯 **Teste rápido**
>
> **Pergunta:** Por que faz sentido o código de uma tarefa passar por portão de merge, mas o status dela ("In progress") não passar por portão nenhum?
>
> <details>
> <summary>Resposta</summary>
> Porque são naturezas diferentes. O código é conhecimento: irreversível na prática (uma vez em produção, mexer custa), audível, merece revisão. O status é estado efêmero: mover um card não decide nada irreversível e seu valor é só "qual é agora". Gatear o status seria pagar cerimônia (PR por tique) sem reduzir risco real. Veja [versione conhecimento, não estado](#status-é-estado-efêmero-não-conhecimento--e-isso-decide-quem-é-a-fonte).
> </details>

---

## Autonomia assimétrica: o agente é livre exatamente onde nada irreversível acontece

Aqui está o núcleo do desenho, e é contraintuitivo: a gente **não** dá ao agente "um pouco de autonomia em tudo". Dá autonomia **total** numa metade e **zero** na outra. A fronteira não é o quão arriscada a ação parece — é se a ação é **reversível**.

A intuição que engana é tratar autonomia como um dial: "deixo o agente fazer 70% e reviso o resto". O problema é que um dial uniforme te dá o pior dos dois mundos — atrito constante nas ações triviais (o agente pede licença pra mover um card) e supervisão diluída justamente onde importa (você aprova mil coisas e deixa passar a única que era irreversível). A assimetria resolve isso: onde reverter é barato, o agente não pede licença nenhuma; onde reverter é caro ou impossível, há sempre um humano no loop.

> 💡 **Princípio — autonomia segue reversibilidade, não risco aparente**
>
> O agente é totalmente livre nas ações cujo erro custa um `ctrl-z`, e nunca decide sozinho nas ações cujo erro custa caro ou é irreversível. A pergunta de desenho não é "isso parece perigoso?", é "se der errado, quanto custa desfazer?".

### O mapa de quem pode o quê

| Autônomo (agente, sem portão) | Gated (humano no loop) |
|---|---|
| Ler o board, descobrir trabalho | Promover uma tarefa de backlog para "pronta para fazer" (curadoria) |
| Reivindicar uma tarefa (assignar-se, comentar) | Aprovar e mergear o PR (verificação real) |
| Mover o status do card | Mexer em segredos, registros (DNS), configurações de produção |
| Executar em branch, commitar | Tocar em estado de produção irreversível |
| **Propor** uma issue nova (entra como rascunho/proposta) | Promover essa proposta a trabalho aceito |

Repare no padrão: o agente **consome, executa e reporta**; o humano **cura a entrada e aprova a saída**. A escrita do agente no board é segura justamente porque mover um card não decide nada irreversível. O que de fato importa — a especificação na issue, o código no PR — ou **notifica** quem precisa ver (a issue muda, os seguidores são avisados) ou **passa pelo portão** (o PR não entra sem revisão). O board livre é um espaço de manobra onde o erro é barato; os pontos caros estão todos do lado gated.

### "Propor" não é "decidir"

Um detalhe sutil mas importante: deixar o agente **propor** trabalho novo (abrir uma issue marcada como proposta) é autônomo e seguro, porque uma proposta não entra na fila de execução — ela espera triagem humana. Já **promover** essa proposta a trabalho aceito é curadoria, e curadoria é gated. A assimetria não está em "o agente pode ou não falar"; está em "a fala do agente, sozinha, muda o que vai ser feito?". Propor não muda; promover muda. Por isso um é livre e o outro tem portão.

> ⚠️ **Armadilha — confundir "barato de escrever" com "barato de desfazer"**
>
> É tentador liberar o agente para promover suas próprias propostas "porque é só mudar um label". A mudança é barata; a **consequência** não. Uma vez promovida, a proposta entra na fila, outro agente a reivindica, executa, abre PR — e você só descobre no fim que aceitou trabalho que não queria.
>
> **Sintoma:** o backlog cresce com tarefas que ninguém humano aprovou; agentes executam coisas tangenciais ao objetivo.
>
> **Resolução:** o portão fica na **promoção**, não na escrita. O agente propõe à vontade; só humano move proposta para a fila de execução.

> 🎯 **Teste rápido**
>
> **Pergunta:** Mover um card de coluna e mergear um PR são ambos "escrever no sistema". Por que um é autônomo e o outro é gated?
>
> <details>
> <summary>Resposta</summary>
> Porque a fronteira é reversibilidade, não "é escrita". Mover um card é reversível a custo zero e não decide nada que dependa dele de forma irreversível. Mergear um PR coloca código no caminho da produção — caro de reverter, e é o ponto onde a verificação real (CI + revisão) precisa acontecer. Mesma ação superficial ("escrever"), reversibilidades opostas, portões opostos. Veja [autonomia segue reversibilidade](#autonomia-assimétrica-o-agente-é-livre-exatamente-onde-nada-irreversível-acontece).
> </details>

---

## O que o board faz sozinho e o que você vai ter que escrever

Boards modernos vêm com **automações built-in** — regras prontas que reagem a eventos do próprio grafo de issues/PRs e mexem no campo de status. Saber exatamente onde elas terminam é o que separa um harness que funciona de um que tem buracos silenciosos. A regra geral: o built-in cobre os eventos *nativos do ciclo de issue/PR* e mexe essencialmente no campo **Status**; tudo que envolve evento custom (label, assignment) ou campo custom exige automação escrita por você.

### O que costuma ser built-in

No GitHub Projects v2 (referência desta lição; outros boards têm conjuntos análogos), as automações prontas incluem, tipicamente:

| Automação built-in | Gatilho | Ação | Habilitada por padrão? |
|---|---|---|---|
| Item fechado → Done | issue/PR fechado | seta Status para `Done` | sim |
| PR mergeado → Done | PR mergeado | seta Status para `Done` | sim |
| Item adicionado → Todo | item entra no board | seta Status para `Todo` | configurável |
| Status muda → fecha issue | Status do item muda | fecha a issue | configurável |
| Auto-add | issue de um repo casa um filtro | adiciona ao board | configurável |
| Auto-archive | item casa um critério | arquiva o item | configurável |

> ⚠️ **Armadilha — confirme o gatilho exato e os defaults da sua versão**
>
> A lista acima envelhece. A superfície de automações built-in muda com o tempo, e alguns gatilhos vêm ligados, outros não. Antes de confiar que "PR mergeado vira Done sozinho", confirme na configuração do **seu** board — e teste com um item de mentira. Tratar a doc de ontem como verdade de hoje é um jeito clássico de ter um board que parece automatizado e não está.

### O que você vai ter que escrever

O que **não** costuma ser built-in, e portanto exige automação sua (um workflow de CI/Action, ou o próprio agente setando via API):

- **"PR aberto → In review".** Abrir um PR é um evento nativo, mas mover o card para `In review` nesse momento normalmente não é uma regra pronta — você liga a issue ao PR (com algo como `Closes #N`) e escreve a transição, ou faz o agente setá-la.
- **Reação a label ou assignment.** Built-in reage a fechar/mergear/abrir; não reage a "alguém pôs o label X" ou "fulano se assignou". Isso é território de Action.
- **Qualquer mexida em campo custom** (Fase, Owner, Prioridade) disparada por evento. Built-in mexe em Status; o resto é seu.
- **Claim atômico** (reivindicar sem corrida) — não existe primitiva pronta; é desenho seu (próxima seção e [colisão multi-agente](#colisão-multi-agente-quando-releitura-basta-e-quando-você-precisa-de-um-lock)).

Para escrever essas transições, a interface é a **API GraphQL** do board. Vale saber duas coisas que pegam gente de surpresa: mutações de campo do board não têm um REST estável equivalente (é GraphQL), e setar um campo de seleção única exige conhecer o ID do campo **e** o ID da opção — não basta o texto "In progress", você precisa do identificador interno daquela opção. A CLI `gh project item-edit` cobre o caso simples (um valor de campo por chamada), mas o trabalho de descoberta de IDs é seu.

> 💡 **Princípio — built-in para o ciclo nativo, automação sua para o resto**
>
> Aceite o built-in onde ele existe (fechar/mergear/adicionar → Status) e não reinvente. Reserve o esforço de escrever automação para as transições que o built-in não cobre — e, dessas, escreva só as que doem na prática. Cada Action é código que você passa a manter.

> 🎯 **Teste rápido**
>
> **Pergunta:** Você quer que o card vá para `In review` quando o agente abre o PR. Por que isso provavelmente não é uma automação built-in, e quais são suas opções?
>
> <details>
> <summary>Resposta</summary>
> Porque built-in reage a fechar/mergear/adicionar e mexe em Status nesses eventos nativos; "PR aberto → mover para In review" não costuma vir pronto. Opções: (1) o próprio agente seta o status via API logo após abrir o PR; (2) um workflow de CI que dispara no evento de PR aberto e seta o campo. Ambos são automação sua, não built-in. Veja [o que você vai ter que escrever](#o-que-o-board-faz-sozinho-e-o-que-você-vai-ter-que-escrever).
> </details>

---

## Regra em prosa não é enforcement — é convenção que sobrevive enquanto for lida

Boa parte de um harness agêntico é descrita em prosa: um arquivo de instruções que todo agente lê no começo da sessão, dizendo "reivindique antes de executar", "abra PR com `Closes #N`", "marque proposta como rascunho". Essa prosa é necessária e barata. Mas é crucial não confundi-la com **enforcement**.

Enforcement por **construção** é uma propriedade do sistema que o agente não consegue violar nem querendo: o portão de merge não deixa o PR entrar sem CI verde, ponto. Enforcement por **prosa** é uma convenção que vale enquanto o agente (a) lê a regra, (b) entende a regra, e (c) escolhe segui-la. Um agente novo, um agente de outro fornecedor, um agente com a regra fora da janela de contexto, ou simplesmente um modelo que interpretou diferente — qualquer um desses fura a convenção sem nenhum sistema reclamar.

> 💡 **Princípio — construção é garantia, prosa é convenção**
>
> Se a violação de uma regra é **cara** (corrompe estado, gasta trabalho, é difícil desfazer), ela merece enforcement por construção — um portão, uma checagem, uma impossibilidade. Prosa é adequada só para o que, se violado, custa barato e é visível. Não defenda um ponto irreversível com um parágrafo.

Isso não quer dizer "nunca use prosa". Quer dizer **casar a força do enforcement com o custo da violação**. Mover um card errado é barato e visível — prosa basta ("mova para In progress ao reivindicar"). Mergear sem revisão é caro — exige portão, não parágrafo. O erro de desenho é proteger o irreversível com prosa ("agentes não devem mergear sem aprovação" escrito num arquivo) e depois se surpreender quando um agente merge sem aprovação.

Há uma mitigação parcial que vale citar: **onde** a prosa mora muda sua taxa de adesão. Uma regra no arquivo que todo agente carrega toda sessão (um `AGENTS.md` ou equivalente) é lida com muito mais frequência que uma regra enterrada num doc que o agente talvez abra. Não vira garantia — continua sendo convenção — mas uma convenção bem-posicionada falha menos. A regra de ouro: prosa para o barato-e-visível, e ainda assim no lugar mais lido possível; construção para o caro-e-irreversível, sempre.

> ⚠️ **Armadilha — o harness que "funciona na demo"**
>
> Você testa com um agente, que leu o arquivo de regras inteiro e seguiu tudo. Lindo. Aí entra um segundo agente, ou o mesmo numa sessão com contexto cheio, e a regra que "estava escrita" não foi seguida.
>
> **Sintoma:** o harness funciona com supervisão e quebra sutilmente quando você relaxa; as violações são sempre de regras que existiam só em prosa.
>
> **Resolução:** liste suas regras e marque cada uma como "barato se violada" ou "caro se violada". Toda regra cara que está só em prosa é uma dívida — promova-a a construção (portão/checagem) ou aceite explicitamente o risco.

> 🎯 **Teste rápido**
>
> **Pergunta:** "Agentes nunca devem expor segredos em logs" — essa regra está adequada como prosa num arquivo de instruções?
>
> <details>
> <summary>Resposta</summary>
> Não, se a violação é cara (um segredo vazado é difícil de "desvazar"). Prosa é convenção que vale enquanto for lida e seguida; um segredo exposto é irreversível. O enforcement adequado é por construção: scanning de segredos no CI que bloqueia o PR, segredos fora do alcance do agente, redação automática de logs. A prosa pode acompanhar, mas não pode ser a única defesa. Veja [construção é garantia, prosa é convenção](#regra-em-prosa-não-é-enforcement--é-convenção-que-sobrevive-enquanto-for-lida).
> </details>

---

## A máquina de estados e seus três modos de falha

O coração operacional do harness é uma **máquina de estados**: o conjunto de estados em que uma tarefa pode estar e as transições permitidas entre eles. Desenhá-la bem é, em grande parte, **antecipar como ela falha**. Um desenho típico tem seis estados:

```text
   ┌──────────┐  curadoria humana  ┌──────┐  agente reivindica  ┌─────────────┐
   │ Backlog  │ ─────────────────► │ Todo │ ──────────────────► │ In progress │
   │(proposta/│                    └──────┘                     └──────┬──────┘
   │ congelado)│                       ▲                               │ abre PR (Closes #N)
   └──────────┘                        │ desbloqueio                   ▼
                                  ┌──────────┐                 ┌─────────────┐
                                  │ Blocked  │ ◄────────────── │  In review  │
                                  └──────────┘  precisa de      └──────┬──────┘
                                                humano/externo         │ PR mergeado (portões ✅)
                                                                       ▼
                                                                  ┌────────┐
                                                                  │  Done  │
                                                                  └────────┘
```

A leitura do diagrama é uma narrativa: uma tarefa nasce em `Backlog` (como proposta ou congelada); um humano a **promove** para `Todo` (essa seta é gated — curadoria); um agente a **reivindica** e move para `In progress` (autônomo); ao abrir o PR vai para `In review`; quando o PR é mergeado com os portões verdes, cai em `Done` (essa transição é o ponto gated duro — a verificação real). Se a qualquer momento o agente esbarra em algo que exige humano (um segredo, um registro, estado de produção), a tarefa vai para `Blocked` e espera desbloqueio.

Agora os modos de falha. Cada um nasce de uma transição mal-desenhada, e cada um tem um antídoto.

### Modo 1 — Claim órfão

Um **claim órfão** é uma tarefa que está `In progress` mas ninguém está de fato trabalhando nela. O agente reivindicou, moveu o card, e então morreu — sessão encerrou, contexto estourou, processo caiu — sem nunca soltar o claim nem terminar. O card mente: diz "alguém está nisso", e não está.

O perigo é que outro agente, lendo o board como verdade, **não** vai pegar essa tarefa (parece tomada) e **não** vai pegar outra coisa achando que essa avança. A tarefa fica num limbo: ocupada por um fantasma.

Antídotos, do mais barato ao mais robusto: (a) uma convenção de que claim inclui timestamp ("claimed @ ts") e tarefas `In progress` antigas demais são suspeitas de órfãs; (b) uma automação que reverte `In progress` sem atividade após um tempo de volta para `Todo`; (c) registrar progresso periódico (heartbeat) de modo que silêncio = órfão. Para baixa concorrência, a convenção de timestamp + revisão humana ocasional basta; alta concorrência pede a automação.

### Modo 2 — Espelho divergente

O **espelho divergente** é o modo de falha que a [partição](#partição-vence-duplicação-porque-dois-escritores-em-duas-cópias-sempre-divergem) existe para prevenir. Surge quando, apesar de tudo, alguém mantém uma segunda cópia de informação (uma lista de tarefas no doc além das issues, um status duplicado em dois campos) e as cópias andam separado. O agente lê a cópia errada e decide errado.

O antídoto não é detecção — é **prevenção por desenho**: não ter espelho. Se você se pega escrevendo um reconciliador que compara duas cópias e alerta quando divergem, pare e pergunte por que existem duas cópias. O reconciliador é o sintoma; a duplicação é a doença. A cura é partição por altitude, não um motor de sync mais esperto.

### Modo 3 — Spec sem portão (ungated)

A **spec ungated** é quando a especificação do que fazer — o conteúdo que decide o que o agente vai construir — vive num lugar que não passa por nenhuma revisão antes de virar trabalho. Se a spec mora num campo livre que o próprio agente edita sem portão, então o agente pode (por erro ou por interpretação) reescrever o próprio enunciado da tarefa e executar contra a versão reescrita. Ninguém revisou; nada notificou.

O antídoto é colocar a spec num lar que **ou notifica ou passa por portão**. Especificação no corpo da issue notifica os seguidores ao mudar (mudança visível). Decisão e código no PR passam pelo portão de merge (mudança revisada). O que não pode existir é spec num canto silencioso e editável — porque aí o agente decide a partir de um enunciado que ninguém validou.

| Modo de falha | Sintoma observável | Decisão de desenho que previne |
|---|---|---|
| Claim órfão | card em `In progress` parado, agente sumiu | claim com timestamp + heartbeat ou reversão por inatividade |
| Espelho divergente | duas cópias da mesma info discordam; agente decide errado | partição por altitude (não ter espelho) |
| Spec ungated | agente executou contra spec que ninguém revisou/viu mudar | spec em lar que notifica (issue) ou gateia (PR) |

> 💡 **Princípio — desenhar a máquina de estados é enumerar como ela mente**
>
> Para cada estado, pergunte: "o que esse estado afirma, e como ele pode estar afirmando uma mentira?". `In progress` afirma "alguém trabalha nisto" — pode mentir (órfão). `Done` afirma "passou pelos portões" — só não mente se a transição para Done for de fato gated. Um estado cuja mentira é barata tolera convenção; um estado cuja mentira é cara exige construção.

> 🎯 **Teste rápido**
>
> **Pergunta:** Por que o modo "espelho divergente" não se resolve com um reconciliador melhor, enquanto o "claim órfão" pode se resolver com uma automação de timeout?
>
> <details>
> <summary>Resposta</summary>
> Porque são problemas de natureza diferente. O espelho divergente é causado por *existir uma segunda cópia* — um reconciliador só trata o sintoma, e a cura é remover a cópia (partição). O claim órfão não vem de duplicação; vem de uma transição que não tem como saber que o ator morreu. Aí uma automação de timeout (reverter In progress parado) ataca a causa real: o estado mente porque ninguém o atualizou, e o timeout detecta o silêncio. Veja [os três modos de falha](#a-máquina-de-estados-e-seus-três-modos-de-falha).
> </details>

---

## Colisão multi-agente: quando releitura basta e quando você precisa de um lock

Reivindicar uma tarefa é, na prática, duas escritas: assignar-se e mover o status. Entre ler "está livre" e escrever "agora é meu", existe uma janela — e se dois agentes leem "livre" ao mesmo tempo, ambos reivindicam, e você tem uma **colisão**: dois agentes na mesma tarefa.

A primeira coisa a entender é que isso é um problema clássico de **condição de corrida** (race condition — quando o resultado depende da ordem imprevisível de operações concorrentes), e que boards de issues geralmente **não** oferecem uma primitiva de "reivindicar atomicamente". Não há um `claim-if-free` que o sistema garanta indivisível. Então a atomicidade, se você precisar dela, é desenho seu.

A segunda coisa é dimensionar a dor antes de pagar por ela. A força da defesa deve casar com a probabilidade e o custo da colisão:

| Cenário | Probabilidade de colisão | Defesa proporcional |
|---|---|---|
| Um operador, agentes raramente simultâneos | baixa | **releitura**: após reivindicar, o agente relê e confirma que ainda detém o claim antes de executar |
| Poucos agentes, ocasionalmente paralelos | média | releitura + claim com timestamp (quem chegou primeiro vence em caso de empate visível) |
| Muitos agentes, alta concorrência | alta | **lock real**: um recurso externo que garante exclusão mútua (ex. um campo que só uma escrita condicional consegue setar, ou uma fila que entrega cada item uma vez) |

A **releitura** é o padrão mais barato e cobre o caso comum: o agente reivindica, faz outra leitura, e só executa se a leitura confirma que o claim é dele; se outro chegou na frente, ele recua e pega outra coisa. Não é um lock — é uma checagem otimista que reduz a janela, não a elimina. Para baixa concorrência, eliminar a janela não vale o custo; reduzi-la basta.

> ⚠️ **Armadilha — chamar releitura de lock**
>
> Releitura ("reivindico, releio, confirmo") **não** é exclusão mútua. Dois agentes podem reivindicar, ambos relerem antes da escrita do outro propagar, e ambos se acharem donos. A janela é menor, não nula.
>
> **Sintoma:** "nunca colidiu" — até o dia em que dois agentes rodam exatamente juntos e ambos abrem PR para a mesma issue.
>
> **Resolução:** seja honesto sobre o que releitura garante (redução de janela) e, se o custo de colisão subir, troque por um lock de verdade. Não venda a si mesmo otimismo como garantia.

> 💡 **Princípio — pague pela atomicidade que a sua concorrência exige, não mais**
>
> Lock real tem custo (complexidade, ponto de falha, latência). Para um operador com agentes raramente simultâneos, releitura é a engenharia certa. Construir exclusão mútua robusta para uma dúzia de tarefas e dois agentes é over-engineering. Suba a defesa quando a concorrência subir — não antes.

---

## Comece pelo loop mínimo, automatize só ao sentir dor

Há uma armadilha que ronda todo este desenho: tentar construir o harness autônomo completo de uma vez. Máquina de estados rica, todas as automações escritas, locks atômicos, heartbeats, reconciliadores — para um punhado de tarefas e um ou dois agentes. Isso não se paga. O esforço de construir e manter o harness supera o valor do trabalho que ele coordena.

O caminho que se paga é incremental. Comece pelo **loop mínimo viável**: um agente que descobre trabalho, executa, atualiza o status, e um humano que observa. Só isso. Esse loop já exercita as decisões que importam — partição, assimetria, a máquina de estados básica — e te ensina **onde dói de verdade**. A dor é o sinal: quando claims órfãos viram problema real, você adiciona heartbeat; quando colisões acontecem, você adiciona lock; quando uma transição manual cansa, você a automatiza. Cada peça de complexidade entra puxada por uma dor observada, não empurrada por uma dor imaginada.

> 💡 **Princípio — complexidade puxada pela dor, não empurrada pelo medo**
>
> Não construa a defesa contra um modo de falha antes de tê-lo observado (ou de ter razão forte para crer que ele será frequente e caro). O harness mínimo que roda e te mostra os modos de falha reais é mais valioso que o harness completo que você projetou contra falhas hipotéticas.

Há um bônus em começar cedo e pequeno que vale nomear: **construir o harness enquanto o custo de errar é baixo**. Se você estrear o harness em tarefas reversíveis (setup, documentação, andaime) antes de haver código com stakes altos, você aprende os modos de falha do harness num ambiente onde errar custa pouco. Quando chegar o trabalho de verdade, o harness já foi debugado nas tarefas baratas. É o mesmo raciocínio de testar o paraquedas perto do chão antes de pular do avião.

E há um critério de reversão honesto que fecha o ciclo: se, depois de um tempo, o board virou mais escrituração que valor — se você gasta mais movendo cards do que ganha em coordenação — simplifique ou descontinue. Manter a reversão barata é o que separa um experimento de uma dívida cerimonial. Um harness é uma ferramenta a serviço do trabalho, nunca o contrário.

> 🎯 **Teste rápido**
>
> **Pergunta:** Por que faz sentido estrear um harness agêntico em tarefas de setup reversíveis antes de usá-lo em código de produção?
>
> <details>
> <summary>Resposta</summary>
> Porque os modos de falha do harness (claim órfão, espelho divergente, transições mal-desenhadas) vão aparecer de qualquer jeito enquanto você aprende a operá-lo — e é muito mais barato que apareçam em tarefas reversíveis do que em trabalho com stakes. Você debuga a dinâmica onde errar custa um `ctrl-z`, e chega ao trabalho de verdade com o harness já endurecido. Veja [comece pelo loop mínimo](#comece-pelo-loop-mínimo-automatize-só-ao-sentir-dor).
> </details>

---

## Limites desta lição

### O que está fora do escopo

Esta lição cobre os **princípios de desenho** de um harness básico de planejamento operado por agentes sobre um board de issues. Várias camadas adjacentes existem e fazem sentido em ambições maiores, mas não foram tratadas aqui:

- **Orquestração multi-agente avançada** — coordenação de muitos agentes especializados (planejador, executor, revisor) com protocolos de handoff e negociação. Esta lição assume poucos agentes e baixa concorrência; orquestração em escala é um campo próprio.
- **Locks distribuídos e consenso** — quando a concorrência é alta o bastante para exigir exclusão mútua robusta, entram primitivas (leases, escritas condicionais, consenso) que esta lição só menciona. Justifica-se quando colisões são frequentes e caras.
- **Idempotência das ações do agente** — garantir que reexecutar uma ação (após um retry) não duplique efeito. Crítico quando agentes operam sistemas com efeitos colaterais não-reversíveis; tratamos só de tarefas reversíveis.
- **Observabilidade e auditoria do harness** — métricas de throughput, tempo em cada estado, taxa de claims órfãos, dashboards de saúde do harness. Vale quando o harness é grande o suficiente para precisar ser medido.
- **Modelagem de permissões fina** — quem pode mover quais campos, RBAC sobre o board, separação de papéis entre tipos de agente. Esta lição usa a assimetria grossa (agente vs. humano); granularidade maior é trabalho próprio.
- **Custo e rate limits da API** — chamar a API do board a cada tique tem custo e teto de requisições. Em volume, isso vira restrição de desenho (batching, cache); aqui assumimos volume baixo.
- **A escolha do substrato** — esta lição usa um board de issues como dado. *Por que* board de issues em vez de uma ferramenta externa, um wiki, ou um banco próprio é uma decisão de arquitetura que merece seu próprio registro (um ADR), não uma lesson.
- **Segurança do agente em si** — prompt injection, exfiltração via ferramentas, sandbox de execução. O harness governa *fluxo de trabalho*; a segurança do agente como executor é uma camada ortogonal e densa.

Cada um desses se justifica quando a escala, a concorrência ou o modelo de ameaça subirem. Para um operador com poucos agentes coordenando trabalho reversível, os princípios desta lição são o piso, não o teto.

### O harness é uma ferramenta, não um troféu

O estado final de um bom harness é discreto: um board onde o status é confiável porque ninguém precisa confiar nele no escuro, agentes que decidem a partir de dados não-ambíguos porque o desenho não deixou ambiguidade entrar, e uma fronteira clara entre o que a máquina faz sozinha e o que espera por um humano. Nada disso é impressionante de olhar. A medida de sucesso não é a sofisticação do harness — é a quantidade de trabalho real que ele deixa fluir sem que você tenha que reconciliar nada no olho.

Partição, autonomia assimétrica, enforcement casado ao custo, e uma máquina de estados desenhada a partir dos seus modos de falha. Quatro ideias, e a disciplina de não construir mais harness do que o trabalho pede. Essa é a viagem inteira.

---

## Leitura adicional

Materiais de aprofundamento usados como base ou complemento desta lição:

**Documentação do substrato (envelhece junto com a plataforma)**

- **[Automating your project (GitHub Docs)](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project)** — porta de entrada para o que é built-in vs. o que exige Action. Consulte para confirmar a lista atual de automações e seus defaults.
- **[Using the built-in automations (GitHub Docs)](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations)** — detalha cada workflow pronto e seus gatilhos. Volte aqui antes de assumir que uma transição é automática.
- **[Using the API to manage Projects (GitHub Docs)](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)** — referência para as mutações GraphQL (IDs de campo e de opção). Use quando for escrever as transições que o built-in não cobre.
- **[`gh project` (GitHub CLI manual)](https://cli.github.com/manual/gh_project)** — superfície da CLI para operar o board em scripts e pelo agente.

**Fundamentos conceituais**

- **[Single Source of Truth (Wikipedia)](https://en.wikipedia.org/wiki/Single_source_of_truth)** — o princípio que sustenta a seção de partição, em forma canônica e agnóstica de ferramenta.
- **Máquinas de estado finito** — qualquer texto introdutório de FSM (*finite state machine*) ajuda a formalizar a intuição de estados e transições; vale para desenhar a sua máquina com transições explícitas e proibidas.
- **[Human-in-the-loop (overview)](https://en.wikipedia.org/wiki/Human-in-the-loop)** — o conceito por trás da autonomia assimétrica, em contexto mais amplo que agentes de IA.

**Camadas que esta lição não cobriu**

- **Race conditions e exclusão mútua** — qualquer material sobre [race condition](https://en.wikipedia.org/wiki/Race_condition) e locks/leases distribuídos, para quando a releitura otimista deixar de bastar.
- **Idempotência em sistemas distribuídos** — para garantir que retries de ações de agente não dupliquem efeito; relevante ao sair de tarefas puramente reversíveis.

---

## Glossário

Termos que aparecem ao longo do texto como apoio e que valem uma definição de bolso. Em ordem alfabética.

- **ADR (Architecture Decision Record)** — documento curto que registra uma decisão de arquitetura, seu contexto e consequências. A *escolha* do substrato (board vs. alternativas) é assunto de ADR; o *raciocínio de desenho* do harness é assunto de lesson.
- **Agente (de IA)** — processo que lê instruções, raciocina e executa ações (rodar comandos, abrir PRs, escrever no board) com autonomia variável. Diferente de um operador humano, ele trata os dados que lê como verdade — daí a exigência de dados não-ambíguos.
- **API GraphQL** — interface de consulta e mutação em que o cliente declara exatamente os campos que quer. No contexto de boards, é a via para mexer em campos de item (status, custom), tipicamente sem REST equivalente estável.
- **Automação built-in** — regra pronta do board que reage a eventos nativos (issue/PR fechado, mergeado, adicionado) e mexe no Status. Não reage a eventos custom (label, assignment) nem mexe em campos custom — isso exige automação escrita.
- **Claim (reivindicação)** — ato de um agente marcar uma tarefa como sua (assignar-se + mover status) antes de executar. Sem primitiva atômica nativa, a corretude do claim depende de releitura ou de lock.
- **Claim órfão** — tarefa marcada como `In progress` cujo agente reivindicante sumiu sem concluir nem soltar o claim. O card afirma trabalho que não está acontecendo; outro agente evita a tarefa por achá-la tomada.
- **Condição de corrida (race condition)** — situação em que o resultado depende da ordem imprevisível de operações concorrentes. No harness, aparece entre "ler que a tarefa está livre" e "escrever que é minha".
- **Enforcement por construção** — garantia que o sistema impõe e o agente não consegue violar (ex.: portão de merge que barra PR sem CI verde). Oposto de enforcement por prosa.
- **Enforcement por prosa** — regra escrita em texto que vale enquanto for lida, entendida e seguida. Adequada para o que, se violado, custa barato e é visível; inadequada para o irreversível.
- **Espelho divergente** — modo de falha em que duas cópias da mesma informação (ex.: tarefas num doc e nas issues) andam separado e passam a discordar. Curado por partição (não ter espelho), não por reconciliação.
- **Estado efêmero** — dado cujo valor relevante é "qual é agora" e que muda o tempo todo (ex.: status de um card). Não merece versionamento em git; vive no board, escrito livremente. Oposto de conhecimento.
- **Harness (de planejamento)** — o conjunto de regras, estados e fronteiras de autonomia que governa como agentes descobrem, reivindicam, executam e reportam trabalho sobre um substrato.
- **Human-in-the-loop** — desenho em que um humano participa obrigatoriamente de certas decisões. No harness, o humano está no loop exatamente nos pontos irreversíveis (curadoria de entrada, aprovação de merge, segredos/produção).
- **Lock (exclusão mútua)** — mecanismo que garante que só um ator por vez detém um recurso. Necessário quando a concorrência é alta; substitui a releitura otimista, que apenas reduz a janela de colisão sem eliminá-la.
- **Máquina de estados** — modelo de estados possíveis de uma tarefa (`Backlog`, `Todo`, `In progress`, `In review`, `Done`, `Blocked`) e das transições permitidas entre eles. Desenhá-la é, em boa parte, enumerar como cada estado pode "mentir".
- **Partição** — dar a cada informação exatamente um lar, separando lares por altitude (estratégia, tarefa, estado, projeção) para que dois lares nunca afirmem o mesmo fato. Elimina divergência por construção; oposto de duplicação.
- **Portão (gate)** — ponto onde uma ação não prossegue sem condição satisfeita (CI verde, revisão humana). Reserva-se para transições irreversíveis ou caras (ex.: merge para a branch de produção).
- **Projeção** — visão derivada de uma fonte, que lê dela e não é editada à mão (ex.: uma view de roadmap que reflete as issues). É o jeito correto de ter "uma visão consolidada" sem criar um espelho divergente.
- **Reversibilidade** — quão barato é desfazer uma ação. É o critério que decide autonomia: o agente é livre no reversível, gated no irreversível.
- **Releitura (otimista)** — padrão de claim em que o agente reivindica, relê o estado e só executa se confirmar que ainda detém o claim. Reduz a janela de colisão, mas não é exclusão mútua — dois agentes ainda podem se achar donos.
- **Spec ungated** — especificação de tarefa que vive num lar sem portão nem notificação, editável em silêncio. Perigosa porque o agente pode executar contra um enunciado que ninguém revisou. Curada colocando a spec onde ela notifica (issue) ou passa por portão (PR).
- **Substrato** — o sistema concreto sobre o qual o harness opera (aqui, um board de issues tipo GitHub Projects v2). O harness é o desenho; o substrato é onde ele roda.

---

## Apêndice — Aplicações documentadas

> Esta seção é específica do projeto talkingpres e pode ser removida por quem usar esta lição em outro contexto. O corpo da lição acima é genérico e reutilizável.

Os princípios desta lição foram destilados a partir de uma avaliação crítica de uma decisão de arquitetura real do projeto. Para ver o desenho aplicado a este contexto, com nomes próprios, taxonomia concreta de labels/campos e o corpus de tarefas da fase corrente, veja:

- **[ADR-0013 — Substrato de planejamento operado por agentes (GitHub Projects)](../adr/0013-substrato-de-planejamento-operado-por-agentes.md)** — a decisão e o porquê: partição por altitude aplicada ao `ROADMAP.md` + issues + board, a máquina de estados concreta, a assimetria de autonomia, e o apêndice operacional com os comandos `gh` de setup.
- **[ADR-0005 — Estratégia de deploy: checks em três portões](../adr/0005-deploy-checks-em-tres-portoes.md)** — os portões reais que tornam o merge a transição gated dura da máquina de estados (o "PR mergeado → Done" só vale com os três portões verdes), e a convenção de branches que o board espelha.

As **regras operacionais** que o harness exige de cada agente (reivindicar, comentar plano, abrir PR com `Closes #N`, propor como rascunho) vivem na seção de board e fluxo dos agentes do [AGENTS.md](../../AGENTS.md) — o arquivo lido toda sessão, posicionado ali justamente pela lógica de [enforcement por prosa bem-posicionada](#regra-em-prosa-não-é-enforcement--é-convenção-que-sobrevive-enquanto-for-lida). Os **passos de setup humano** (criar o board, campos e views) pertencem a um guide, não a esta lesson.
