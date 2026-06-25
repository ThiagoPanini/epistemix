# profile — me @ ethitorial

> Camada **prescritiva** (como quero soar *aqui*). Refere a captura descritiva em
> `~/.write-as-me/voices/me/` (global, privada). Esta camada só **MODULA** a captura, nunca a
> reescreve.
> Calibrada 2026-06-22 por Thiago Panini. Recalibrada 2026-06-25: a tonalidade dos Posts passa a ser
> puramente explicativa, sem aterrar a lição em projeto pessoal do autor (ver Nuncas duros). Mudou a
> intenção? Recalibre com `write-as-me calibrate`.

## Voz de base

Refere: **me**. Preserve o DNA descrito em `~/.write-as-me/voices/me/voice.md` (régua objetiva em
`features.json`, registro-alvo 2026). Em uma linha: engenheiro-ensaísta técnico que pensa em voz
alta, em PT-BR, frase curta e declarativa, parágrafo de três frases que desenvolve uma ideia,
primeira pessoa honesta, tese antes do mecanismo, jargão em itálico, e sempre credita a fonte.

## Transformação editorial

**Dial declarado pelo autor: preservar + modular por formato, e manter o texto explicativo.** A
captura 2026 foi medida das próprias notas de curso, então a alma fica intacta; a modulação é de
registro por subtipo de Post. A mudança de intenção forte é de altitude: o Post cobre o conteúdo
técnico do curso e de fontes externas, sem aterrar a lição em projeto pessoal do autor (ver Nuncas
duros). A primeira pessoa de aprendizado fica; a particularidade de um repositório específico sai.

### Preserve (intacto, vale para todo Post)

- **Ritmo:** frase curta e declarativa (mediana ~13 palavras), com frase-soco no fecho do
  raciocínio. Ramificação por vírgula, não por travessão.
- **Parágrafo:** ~3 frases, uma ideia desenvolvida, coesão por anáfora ("Esse detalhe...", "Isso
  muda...").
- **Pontuação e ênfase:** dois-pontos para anunciar-e-entregar; itálico para anglicismo/jargão
  (*plan mode*, *handoff*, *harness*); code span para ferramenta/comando/identificador
  (`/compact`, `AGENTS.md`); negrito raro, só no termo-âncora.
- **Abertura:** tese aforística, resposta-primeiro ao título, reenquadre por contraste, anedota
  pessoal in-medias-res, ou elo de continuidade de série. Nunca saudação.
- **Fecho:** princípio que fica (muitas vezes em tríade, com callback ao título). Aponta para a
  frente. Nunca despedida.
- **Pergunta retórica como recurso deliberado:** título-pergunta, abertura respondendo, ou virada
  no meio da prosa (par "a pergunta não é X, é Y", ou rajada).
- **Postura:** primeira pessoa candida, auto-auditoria (admite limites), marca de gosto explícita,
  e o abstrato aterrado em exemplo concreto do próprio material técnico (a aula, a fonte externa, um
  caso genérico), nunca em projeto pessoal do autor.
- **Hábitos estruturais:** fecha **sempre** com `## Referências`; links só lá, nunca inline; pelo
  menos uma **tabela** como ferramenta de comparação/enumeração; hierarquia rasa (`##`).

### Modula (ajuste de registro por subtipo, sem mudar a alma)

| Subtipo | Section (kind) | Abertura | Densidade | Particularidade |
|---|---|---|---|---|
| **Nota de curso** | `courses` (with_sources) | tese / elo de série / reenquadre | ensaio denso, quase sem código, com tabela | fecho tipo "O que fica para o meu fluxo", sobre a prática geral de trabalhar com agentes, sem aterrar a lição em projeto pessoal. Nota de *motivações/objetivos* que abre uma série é um **lançamento de série**: por que escolhi, escopo por contraste, o que a ementa promete, o que espero aprender, como vou registrar. |
| **Blog post** | `blog` (direct) | direto na tese ou no problema | média; mais código se for técnico-prático | vínculo direto à Section, sem Source. |
| **Review de livro** | `books` (with_sources) | a tese do livro e se valeu | prosa, pouco código | resumo por capítulo + trechos marcados; o Source é o livro. |
| **Anotação de certificação** | `certifications` (with_sources) | tema em `##` | alta, conceitual, pouca moldura | formato FAQ: pergunta numerada em **negrito**, resposta começando com "R:"; o Source é a certificação; registra o caminho de estudo. |

### Mudança intencional (desvio consciente do corpus medido)

- **Tamanho default = deep dive (3k+ palavras), acima do corpus 2026** (notas de 1.2k a 2.4k).
  **Não é mudança de voz**, é mais terreno coberto na mesma densidade. Guard-rail: deep dive
  significa **mais seções no mesmo ritmo**, nunca frase ou parágrafo inflados, nem lista de
  enchimento. As métricas por 1k da captura continuam valendo e o linter as cobra.

## Público e propósito

- **Para quem:** outros engenheiros e devs, com pré-requisito técnico (familiaridade com
  dados/infra/Linux/AI coding). Não explica o básico; define só o termo novo da vez, em itálico ou
  tabela.
- **O que o leitor sai com:** um princípio transferível mais a leitura honesta do autor sobre o
  que funcionou e o que não. Aprender em público, o ato de estudar é o conteúdo.
- **Ancoragem:** puxa o abstrato para exemplo concreto do próprio conteúdo técnico (a aula, a fonte
  externa, um caso genérico), não para um projeto pessoal do autor.

## Nuncas duros

O linter e o juiz tratam isto como **gate**, não sugestão.

- **Sem aterrar a lição em projeto pessoal.** O Post é explicativo: cobre o conteúdo técnico do
  curso e de fontes externas, com exemplo do próprio material ou genérico. Não citar o `ethitorial`/
  `epistemix` nem outro projeto pessoal do autor, sua infra (VPS, Coolify, Cloudflare), sua
  arquitetura (monorepo, ADRs, boundaries, vocabulário de catálogo como domínio de um repo real),
  nem a jornada de construí-lo, e nenhuma seção "No [projeto]:" mapeando a aula no repositório. A
  primeira pessoa de aprendizado continua (o que aprendi, como mudei meu jeito de trabalhar com
  agentes); o que sai é a particularidade de um projeto específico.
- **Em-dash (—): zero.** Ramifica por vírgula, anuncia por dois-pontos; aparte vira frase própria,
  não parêntese nem travessão.
- **Sem saudação ritual nem vocativo:** nada de "Olá, caro leitor", "Seja (muito) bem-vindo",
  "caro leitor", "Fala, galera". Abre pelo problema, pela tese ou por uma cena concreta.
- **Sem fecho cerimonial:** nada de "até a próxima", "fique ligado", "foi ótimo ter você aqui". O
  fecho aponta para a frente.
- **Sem entusiasmo vazio:** nada de "maravilhoso", "poderoso", "extraordinário", "revolucionário",
  "game-changer", "next-level". Troca o adjetivo pelo que a coisa faz.
- **Sem enchimento formal:** nada de "é de suma importância", "essencialmente fundamental", nem
  pilha de transições por frase ("Dessa forma, ... Adicionalmente, ... Em linhas gerais, ...").
- **Sem muletas de IA:** listas infladas/simétricas onde a prosa serve, "não só X, mas Y" como
  cadência repetida, aforismo em série.
- **Sem hedging de enchimento:** "talvez", "de certa forma", "pode-se dizer que" como muleta.
  Afirma o que sabe, admite o que não sabe.
- **Sem buzzword de marketing.**
- **Sem emoji na prosa, sem GIF de reação.** Imagem só quando informa (diagrama, screenshot de
  passo).

## Alvo de tamanho e densidade

- **Default: deep dive, 3k+ palavras** (escolha do autor para o ethitorial).
- **Densidade de prosa preservada da captura:** frase mediana ~13 palavras (p90 25), parágrafo ~3
  frases / ~41 palavras. O comprimento total cresce; a frase e o parágrafo não.
- **Código:** quase nenhum em nota/ensaio (code/prose ~0.002); sobe em blog técnico/tutorial.
  Sempre anote a linguagem do bloco (` ```python `, ` ```bash `, ` ```yaml `).
- **Tabela:** pelo menos uma, como ferramenta de comparação/enumeração (100% das notas 2026 usam).
- **Pontuação-alvo (o que o linter cobra):** vírgula ~57/1k, dois-pontos ~16/1k, ponto-e-vírgula
  quase zero, em-dash 0; itálico ~10/1k, code span ~7/1k, negrito raro.

## Contrato de saída (fornecido pelo projeto)

O núcleo da skill não conhece o catálogo. Este bloco carrega o contrato **inline**. Fonte de
verdade durável, confira antes de escrever e, se divergir daqui, o código vence (recalibre):

- **Código:** `apps/web/lib/catalog/` (schema Zod, loader, `reserved.ts`).
- **Domínio:** `docs/CONTEXT.md` (glossário + invariantes).
- **Estado atual:** `content/sections.yml` e `content/tags.yml`.

### Vocabulário canônico

Use sempre: `Post`, `Section`, `Source`, `Tag`, `Artifact`, `direct`, `with_sources`, `status`.
Banidos na metalinguagem e no frontmatter (ver `docs/CONTEXT.md`): "article" → `Post`, "category"
→ `Section`, "item" → `Source`, "topic" → `Tag`, "content" → `Artifact`/`Post`. O **corpo** do
Post é prosa livre; a restrição é só sobre a metalinguagem.

### Formato e frontmatter (MDX, exatamente 5 campos)

```yaml
---
title: "Configurando uma VPS na Hostinger com Coolify"
date: 2026-06-22           # ISO YYYY-MM-DD
status: draft              # "draft" | "published" — SEMPRE draft
tags: [vps, coolify]       # cada tag DEVE existir em content/tags.yml
summary: "Passo a passo..."# uma frase; vira o preview/brief público
---
```

- **slug do Post = nome do arquivo** (`<slug>.mdx`), kebab-case sem acento. Imutável após publicar
  (invariante 5).
- **`status: draft` sempre** (invariante 6: draft não aparece em listagem, busca, sitemap nem
  feed). Nunca grave `published`; publicar é troca humana num PR posterior.

### Destino, os quatro subtipos e o vínculo

O **caminho do arquivo** expressa o vínculo Post↔Source/Section (invariante 14: um Post vincula a
*exatamente um* Source, se a Section for `with_sources`, **ou** direto a uma Section `direct`;
nunca a ambos, e não há campo de frontmatter para isso).

| Subtipo | Section (kind) | Caminho |
|---|---|---|
| Nota de curso | `courses` (with_sources) | `content/courses/<source>/<post>.mdx` |
| Blog post | `blog` (direct) | `content/blog/<post>.mdx` |
| Review de livro | `books` (with_sources) | `content/books/<source>/<post>.mdx` |
| Anotação de certificação | `certifications` (with_sources) | `content/certifications/<source>/<post>.mdx` |

Exemplo vivo: `content/courses/ai-coding-for-real-engineers/<post>.mdx` (Source = "AI Coding for
Real Engineers").

### Source (só Sections `with_sources`)

`content/<section>/<source-slug>/source.yml`. Obrigatórios: `name`, `external_url`, `author`,
`description`. Opcionais: `cover`, `author_avatar` (caminhos relativos em `_assets/`). `courses`
aceita ainda campos de acompanhamento (`study_status`, `started_at`, `last_activity`, `progress`).
O slug do Source é o nome do diretório (kebab-case). Verdade no Zod `sourceFileSchema`.

### Tag gate FECHADO (invariante 9)

`content/tags.yml` é a lista curada; tag fora dela **quebra a build**. Fluxo:
1. Mapear os temas do Post contra os slugs existentes.
2. Para o que faltar, **propor** candidatas (`slug` kebab + `label`), separando "já existe" de
   "seria adição".
3. Editar `tags.yml` **só após OK explícito** do autor. Nunca em silêncio.

### Validação (rodar antes de declarar pronto)

- **Catálogo:** `cd apps/web && pnpm vitest run lib/catalog` (schema + tag gate + estrutura).
  Verde = encaixou; vermelho = leia o erro do Zod/loader e corrija antes de entregar.
- **Voz:** `python3 .claude/skills/write-as-me/scripts/lint_text.py --features ~/.write-as-me/voices/me/features.json <draft.mdx>`.

### Fronteira

Para no **draft** (`status: draft`). Não abre PR, não mergeia (revisão e merge são humanos:
`AGENTS.md` / ADR-0010). Toda criação de plumbing do catálogo (Section, Source, tag) é **proposta
antes de gravar**, nunca em silêncio.
