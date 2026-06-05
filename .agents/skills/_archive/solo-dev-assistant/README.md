# solo-dev-assistant

`solo-dev-assistant` e uma skill de bolso para desenvolvimento solo com agentes de IA.

Ela nao tenta substituir skills especializadas. O papel dela e simples: criar uma base inicial para projetos novos, mostrar o estado atual de uma sessao de trabalho e recomendar o proximo movimento do processo.

## Quando usar

Use esta skill quando voce quiser:

- iniciar um projeto novo com documentos minimos;
- entender rapidamente o que esta em voo, bloqueado ou disponivel;
- decidir se o proximo passo e grill, pesquisa, prototipo, PRD, issues, implementacao ou review;
- manter o estado do projeto em Markdown versionado, sem criar tracker privado.

## Comandos

### `/solo-dev-assistant start`

Use em um projeto novo, antes de existir uma estrutura clara de documentacao.

O comando faz um intake curto:

1. que problema o projeto resolve;
2. para quem;
3. como saber que a V1 deu certo.

Se as respostas forem vagas, ele pode fazer ate duas rodadas extras de perguntas focadas. Depois, gera cinco arquivos:

```text
README.md
AGENTS.md
docs/VISION.md
docs/ROADMAP.md
docs/CONTEXT.md
```

Exemplo:

```text
/solo-dev-assistant start
```

Resultado esperado:

- `README.md` apresenta o projeto;
- `AGENTS.md` orienta agentes futuros;
- `docs/VISION.md` registra problema, publico e criterio de V1;
- `docs/ROADMAP.md` nasce como seed provisoria, nao como roadmap final;
- `docs/CONTEXT.md` nasce como esqueleto de glossario e invariantes.

Depois do `start`, o caminho natural e refinar a visao com `grill-me` e preencher linguagem de dominio com `grill-with-docs`.

### `/solo-dev-assistant briefing`

Use no comeco de uma sessao para entender o estado do projeto.

O comando e read-only. Ele le:

- `docs/ROADMAP.md` ou `ROADMAP.md`;
- branches locais do git;
- PRs abertos via `gh`, quando disponivel;
- commits recentes que tocaram o roadmap;
- o mapa estatico de skills sugeridas.

Exemplo:

```text
/solo-dev-assistant briefing
```

Saida esperada:

```markdown
## Briefing — meu-projeto @ Fase 0 — Fundacao

### Em voo

### Bloqueado / aguardando

### Disponivel para pegar (top 5)

### Skills sugeridas

### Recem-concluido (ultimos 7 dias)
```

Use esse comando quando voce quer responder perguntas como:

- "o que esta em andamento?";
- "o que esta bloqueado?";
- "qual tarefa posso pegar agora?";
- "existe PR aberto relacionado a isso?".

### `/solo-dev-assistant cycle`

Use quando voce nao sabe qual deve ser o proximo movimento.

O comando tambem e read-only. Ele olha para docs, roadmap, git, PRs e artefatos locais de spec/slices, e tenta diagnosticar a fase provavel do processo:

```text
Start -> Grill -> Research -> Prototype -> PRD -> Issues -> Implement -> Review
```

Exemplo:

```text
/solo-dev-assistant cycle
```

Saida esperada:

```markdown
## Cycle — meu-projeto

### Fase provavel
Grill — confianca: media

### Evidencias
- contexto de dominio ausente ou ainda com TODO/perguntas em aberto

### Proximo movimento
Resolver escopo, linguagem de dominio e decisoes antes de criar specs ou tarefas.

### Skill ou workflow recomendado
/grill-me ou /grill-with-docs

### Prompt sugerido
> Use grill-me para refinar este projeto...

### Edicao opcional de roadmap
opcionalmente marcar o item de refinamento do roadmap como `🚧` apos confirmacao.
```

Importante: `cycle` recomenda, mas nao executa. Se ele sugerir editar o roadmap, a edicao precisa de confirmacao explicita.

## Marcadores de roadmap

A skill entende um formato simples de estado em Markdown:

```markdown
- [ ] tarefa disponivel
- [ ] tarefa em andamento 🚧
- [ ] tarefa bloqueada 🚧 (aguardando: motivo)
- [ ] task blocked 🚧 (waiting: reason)
- [x] tarefa concluida
```

Esses marcadores permitem que `briefing` e `cycle` funcionem em qualquer projeto sem depender de board, issues ou arquivo de estado privado.

## Fluxo recomendado

Para projeto novo:

1. Rode `/solo-dev-assistant start`.
2. Refine a visao com `grill-me`.
3. Preencha o contexto com `grill-with-docs`.
4. Use `/solo-dev-assistant cycle` para decidir o proximo passo.
5. Use `/solo-dev-assistant briefing` no inicio de cada nova sessao.

Para projeto existente:

1. Garanta que exista `docs/ROADMAP.md` ou `ROADMAP.md`.
2. Rode `/solo-dev-assistant briefing`.
3. Rode `/solo-dev-assistant cycle` se o proximo passo nao estiver claro.

## Limites da v1

A v1 nao cria:

- PRD final;
- issues automaticamente;
- board;
- branch;
- PR;
- codigo de produto;
- arquivo privado de tracking.

Ela cria orientacao e continuidade. O trabalho especializado fica com as skills certas para cada fase.
