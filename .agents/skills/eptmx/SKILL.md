---
name: eptmx
description: >-
  Handler de autoria de conteúdo do epistemix. Cria, estrutura, revisa e calibra Posts do hub
  (blog, nota de curso, review de livro, anotação de certificação) na voz do autor, já no lugar
  certo de content/, com frontmatter válido e tags curadas. Multi-comando: write (draft MDX
  completo), outline (só a estrutura), revise (calibra um draft existente), scaffold (cria
  Section/Source/tags), calibrate (re-destila a voz do corpus), slides (roadmap). Use sempre que
  o autor quiser criar, iniciar, rascunhar, estruturar, revisar ou polir um post/artigo/nota/
  review/tutorial para o hub — ex.: "quero iniciar um blog post sobre configurar VPS na Hostinger
  com Coolify", "rascunha um review desse livro", "revisa esse draft", "cria a seção de cursos" —
  mesmo sem dizer "MDX", "Post", "eptmx" ou o nome do comando. Não use para editar UI, código de
  app ou docs de arquitetura (ADR/CONTEXT) — só conteúdo publicável do catálogo.
---

# eptmx — handler de autoria de conteúdo do epistemix

Transforma uma intenção do autor ("quero escrever sobre X", "revisa isso", "cria a seção de
cursos") numa entrega encaixada no catálogo do epistemix, na voz dele. É um **handler
multi-comando** (inspirado no `impeccable`): o `SKILL.md` roteia; cada comando tem seu playbook
em `commands/<comando>.md`, carregado sob demanda.

O valor está em duas coisas que um output genérico não tem: **soar como o autor** e **encaixar
no modelo de domínio sem quebrar a build**. Toda a estrutura existe para garantir as duas.

## Setup — carregue o terreno (uma vez por sessão, proporcional ao comando)

Leia sob demanda, não tudo sempre. Se já leu um item nesta conversa, não releia.

1. `references/catalog-model.md` — onde o conteúdo vive, o schema exato do frontmatter, o tag
   gate fechado, e como o vínculo Post↔Section/Source é expresso pelo caminho do arquivo. É o
   contrato que todo output precisa honrar. **Necessário para:** `write`, `outline`, `revise`,
   `scaffold`, `slides`.
2. `references/STYLE.md` — a voz do autor, separada em **DNA** (preserve) e **ritual de 2022**
   (modernize). A doutrina de voz abaixo resume o default. **Necessário para:** `write`,
   `outline`, `revise`, `calibrate`.
3. O estado real do catálogo agora: `content/sections.yml`, `content/tags.yml` e os diretórios
   de Section/Source existentes — saiba o que já existe antes de propor criar. **Necessário
   para:** `write`, `outline`, `scaffold`, e o menu sem-argumento.

`calibrate` só precisa de (2); `slides` (stub) só de (1). Os demais carregam o terreno cheio.

## Doutrina de voz (default)

**"Mesma alma, menos ritual."** Preserve o DNA do autor — primeira pessoa didática,
storytelling (contexto antes do mecanismo), honestidade sobre o que é denso, escada
pedagógica, código com disciplina, citações. **Corte o ritual de 2022** — a saudação "Olá,
caro leitor! Seja muito bem vindo…", o entusiasmo vazio ("maravilhoso", "poderoso"), o
enchimento formal, a despedida cerimonial. Detalhe e âncoras em `references/STYLE.md`.

## Fronteira (HITL na borda)

Você **para no artefato pronto** para o autor revisar. **Não abre PR nem mergeia** — revisão e
merge são humanos (AGENTS.md / ADR-0017). Toda criação de plumbing do catálogo (Section,
Source, tag) é **proposta antes de gravar**, nunca em silêncio.

## Comandos

| Comando | Categoria | Descrição | Playbook |
|---|---|---|---|
| `write [tema]` | Criar | Draft MDX completo de um Post, da entrevista ao self-verify | [commands/write.md](commands/write.md) |
| `outline [tema]` | Criar | Só a estrutura: entrevista + esqueleto + destino + tags, sem prosa | [commands/outline.md](commands/outline.md) |
| `revise [post]` | Refinar | Calibra um draft existente: voz, aperto, frontmatter, self-verify | [commands/revise.md](commands/revise.md) |
| `scaffold [section\|source]` | Andaime | Cria Section/Source/tags no catálogo, sem escrever Post | [commands/scaffold.md](commands/scaffold.md) |
| `calibrate` | Voz | Re-destila `references/STYLE.md` a partir do corpus | [commands/calibrate.md](commands/calibrate.md) |
| `slides [post]` | Roadmap | (ainda não implementado) Gera apresentação a partir de um Post | [commands/slides.md](commands/slides.md) |

## Regras de roteamento

1. **Sem argumento** ("o que dá pra fazer?"): NÃO rode comando automaticamente. Olhe o estado
   do catálogo (do Setup) e ofereça os **2–3 próximos passos de maior valor** com o comando
   exato a digitar, seguidos da tabela completa acima. Ex.: catálogo vazio de uma Section nova →
   `scaffold`; um draft tocado no git → `revise <arquivo>`; pedido de conteúdo novo → `write`.
2. **Primeira palavra casa um comando** (`write`, `outline`, `revise`, `scaffold`, `calibrate`,
   `slides`): carregue `commands/<comando>.md` e siga o playbook. O resto do argumento é o alvo.
3. **Não casa, mas a intenção mapeia claro** num comando: "rascunha um post sobre X" → `write`;
   "revisa/poli esse draft" → `revise`; "só me dá a estrutura" → `outline`; "cria a seção de
   cursos" / "preciso cadastrar esse livro" → `scaffold`; "re-destila a voz" → `calibrate`.
   Carregue o playbook correspondente e prossiga como se invocado. Se dois comandos couberem,
   pergunte uma vez qual.
4. **Sem mapeamento claro**: trate como `write` se o autor quer produzir conteúdo; senão,
   pergunte o que ele quer fazer, mostrando a tabela.

O Setup (terreno + doutrina de voz) já está carregado quando o playbook roda; os comandos não
re-invocam o roteador.
