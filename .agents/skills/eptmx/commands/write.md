# write — draft MDX completo de um Post

Transforma uma ideia num **draft MDX completo e publicável**, na voz do autor, encaixado no
catálogo. Você já carregou o Setup do `SKILL.md` (catalog-model, STYLE, estado do catálogo).

```
Entrevistar → Resolver destino → Resolver tags → Escrever o draft → Self-verify → Entregar
```

Pare ao final do draft. Não abre PR nem mergeia.

## 1. Entrevistar (adaptativo, estilo grill-me)

Não despeje um formulário. Pergunte **uma de cada vez**, ramificando conforme as respostas, com
uma recomendação sua em cada pergunta. O objetivo é sair com insumo para escrever algo que o
autor reconheça como dele, não um texto que ele reescreveria do zero.

Cubra, na ordem que o tema pedir (deixe a resposta anterior guiar a próxima):

- **Tema e formato** — post de blog solto, nota de curso, review de livro, anotação de cert?
  (define se o destino é Section `direct` ou `with_sources`.)
- **Destino** — em qual Section entra? Se `with_sources`, qual Source? Já existe ou cria? (§2)
- **Tese / ângulo** — qual é a *única* ideia que o leitor leva? Até tutorial tem ângulo ("por
  que Coolify em vez de Nginx na mão"). Se o autor não tiver clareza, ajude a achar — é o que
  separa post vivo de despejo de passos.
- **Público e pré-requisitos** — para quem? O que assume que o leitor já sabe?
- **Esqueleto** — quais seções, em que ordem, qual o arco. Tutorial: pré-requisitos → passos →
  validação → armadilhas. Confirme o outline antes da prosa.
- **Insumos concretos** — comandos, código, números, versões, links, prints. Texto técnico sem
  o concreto vira vago. Peça o que faltar.
- **Tags** — que temas categorizam? (resolvidas no §3.)
- **Profundidade e tamanho** — panorama curto ou guia denso?
- **Idioma** — PT-BR por padrão; EN só sob pedido.
- **Tom** — default "mesma alma, menos ritual" (doutrina do SKILL.md). Só confirme se o autor
  quiser o registro caloroso completo de série; caso contrário, modernize.

Tema denso ou tese nebulosa → faça uma segunda rodada curta de follow-ups. Claro → siga.

## 2. Resolver o destino (cria o andaime que faltar)

Um `Post` vive em exatamente um lugar (invariante 14). Determine qual e **proponha antes de
criar** qualquer arquivo de config:

- **Section `direct`** (ex.: Blog): `content/<section>/<post-slug>.mdx`. Section inexistente →
  proponha a entrada em `content/sections.yml` (slug kebab não-reservado, title, `kind: direct`,
  `order` coerente, description). Crie só após o OK.
- **Section `with_sources`** (Courses/Books/Certifications): `content/<section>/<source-slug>/
  <post-slug>.mdx`. Source inexistente → proponha o `source.yml` (name, external_url, author,
  description — snake_case). Section inexistente → proponha-a também. Crie só após o OK.

Para plumbing mais pesado (Section nova + Source novo de uma vez), o playbook de
[scaffold](scaffold.md) tem o detalhe; aqui basta propor e gravar com o mesmo cuidado.

Sempre mostre o caminho final do arquivo e o que será criado, e espere confirmação.

## 3. Resolver tags (gate fechado — proponha, não imponha)

`content/tags.yml` é curado e fechado: tag fora dele quebra a build (ADR-0008). Separe o que
**já existe** do que **seria adição**, proponha slugs/labels candidatos, e só edite `tags.yml`
**após o OK explícito**. Nunca adicione tag em silêncio. Se o autor recusar adições, restrinja
o frontmatter às tags existentes que melhor sirvam.

## 4. Escrever o draft

Escreva o `.mdx` **inteiro** — prosa completa, não esqueleto. Voz por `references/STYLE.md`:

- **Abra direto** na tese ou no problema (DNA §1.2). Se for série, ligue ao post anterior com
  um elo curto — **sem** "Olá, caro leitor! Seja muito bem vindo…" (ritual §2.1).
- **Conte a história antes do mecanismo** (DNA §1.3): contexto/motivação antes do passo a passo.
- **Seja honesto sobre o denso** e reassegure (DNA §1.4). Escada pedagógica, um degrau por vez.
- **Headings que são promessas concretas**, não "Introdução"/"Conclusão" genéricos.
- **Código com disciplina** (DNA §1.7): anuncie o que o bloco faz, bloco com linguagem anotada
  e comentários `#` em PT-BR, depois explique o resultado. Comandos reais, nunca pseudocódigo.
- **Valor específico no lugar de entusiasmo vazio** (ritual §2.3): diga o que a coisa faz.
- **Fecho que aponta para a frente** (DNA §1.11), sem despedida cerimonial (ritual §2.5).
- Recap em bullets no fim é ok se consolidar de verdade (DNA §1.12).

Frontmatter: exatamente `title, date (ISO de hoje), status: draft, tags, summary`. `status` é
**sempre `draft`** — nunca `published`. `summary` é uma frase que funciona como preview.

Slug do arquivo: kebab-case do título, sem acento ("Configurando uma VPS na Hostinger" →
`configurando-uma-vps-na-hostinger.mdx`).

Corpo: use os insumos concretos coletados. **Não invente fatos técnicos** que o autor não deu
nem que você não possa fundamentar. Se faltar um dado para o passo funcionar, marque com um
`> TODO:` visível em vez de inventar.

## 5. Self-verify

```bash
cd apps/web && pnpm vitest run lib/catalog
```

Verde = frontmatter válido, todas as tags existem, arquivos no lugar certo. Vermelho = leia o
erro e corrija. Sem `pnpm`? Confira à mão: cinco campos do frontmatter, todas as tags em
`tags.yml`, caminho do arquivo expressando o vínculo certo, `status: draft`.

## 6. Entregar

Resuma em poucas linhas: o que foi criado e onde (caminho do Post + qualquer `sections.yml`/
`source.yml`/`tags.yml` tocado); o resultado do self-verify; os `> TODO:` que sobraram. O
próximo passo é dele: revisar, ajustar a voz onde soou off, abrir o PR. O draft é seguro
(`status: draft` não vai ao ar). Ofereça iterar via [revise](revise.md) — cada correção do
autor é material para refinar `references/STYLE.md`.
