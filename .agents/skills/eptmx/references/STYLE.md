# STYLE.md — a voz do autor (Thiago Panini)

> **Status: v2 — re-destilado do corpus completo (2026-06-07).** Base: os **40 artigos
> publicados** do `panini.hashnode.dev` (séries **Linux Básico**, **Visão Geral sobre o
> Ecossistema Hadoop** e **Apache Spark**; 2022) **+ 6 drafts** que abrem formatos novos
> (FAQ de certificação, log semanal em inglês, boas-vindas de série, tutorial AWS), tudo no
> repo irmão **`../hashnode-backup`** (clone separado, fora do epistemix; ~46 `.md`), mais o
> post atual `content/courses/aihero/primeiras-impressoes.mdx` (2026). O `corpus/` da skill
> fica **vazio de propósito** — o corpus-base mora no repo irmão, não duplicado aqui.
> Cada traço abaixo tem âncora num trecho real. Re-destile com `eptmx calibrate` quando o
> corpus crescer (o playbook sabe achar `../hashnode-backup` e `content/**/*.mdx`).

A skill escreve *como o autor escreveria*, não como um LLM genérico. Mas há uma decisão de
calibragem registrada: o corpus de 2022 é **caloroso e ritualístico**; o autor pediu
**"mesma alma, menos ritual"**. Por isso este arquivo separa duas camadas:

- **DNA** (§1) — a alma. Preserve sempre. É o que faz o texto soar como ele.
- **Ritual de 2022** (§2) — a cerimônia datada. Por padrão, **modernize / corte**. É o que
  faz o texto soar como blog de 2022, não como o autor de hoje.

Quem decide a dosagem é o comando (`write` moderniza por padrão; `revise` pode pedir o tom)
e, na dúvida, o autor na entrevista.

### Quem é, em uma linha (do corpus)

Engenheiro de dados/Analytics, **AWS Community Builder**, que aprende em público e ensina o
que aprende. Escreve em PT-BR, por série, com forte fundamentação teórica antes da prática,
código real e uma lista de Referências no fim. Honesto sobre ser um projeto solo de tempo
livre. O blog de 2022 era o `panini-tech-lab`/`panini.hashnode.dev`; o epistemix é a casa nova.

---

## 1. DNA — preserve sempre

### 1.1 Primeira pessoa, didático, aprendendo em público

Escreve como quem aprendeu na prática e está compartilhando — não como manual corporativo
nem autoridade distante. Admite o escopo e os próprios limites sem se diminuir. O ato de
estudar **é** o conteúdo: ele declara que vai "ler, pesquisar, assistir aulas e aprender".

> "Para escrever e compartilhar conteúdos nesta série, certamente irei ler, pesquisar,
> assistir aulas e aprender muito sobre o Linux."

> "Comecei o AI Hero com um objetivo concreto: parar de tratar 'app de IA' como caixa-preta." *(2026)*

### 1.2 O objetivo do texto é declarado cedo, em seção própria

Quase todo artigo tem, logo no começo, um bloco que diz **o que o leitor vai tirar dali** —
muitas vezes uma seção tipo "a proposta do artigo" ou "Main Purpose". O leitor nunca fica
perdido sobre o porquê.

> "## Um passo de cada vez: a proposta do artigo — (...) este artigo terá como objetivo
> apresentar os elementos de linhas, colunas e expressões que configuram toda a dinâmica de
> seleção de dados de um DataFrame."

### 1.3 Define o escopo por contraste — o que NÃO é, para cravar o que é

Movimento-assinatura: antes de prometer, ele **delimita**. Diz o que o texto *não* vai
cobrir e, por oposição, deixa nítido o ganho real que oferece. É honestidade que protege a
expectativa do leitor e foca a entrega.

> "Não tenho como meta mergulhar a fundo e explorar detalhadamente cada conceito (...), mas,
> por outro lado, imagino que interessante seria ganhar uma maior autonomia e segurança em
> encontrar (...) termos como Unix, GNU, Debian, Ubuntu."

> "(...) os artigos desta série não terão seções teóricas dedicadas, deixando sempre a cargo
> de referências auxiliares (...) qualquer tipo de conhecimento complementar." *(AWS Labs)*

### 1.4 Storytelling técnico: contexto antes do mecanismo

Contextualiza antes de mergulhar. Liga o conceito a uma motivação ou a uma história real, em
vez de despejar o passo a passo seco. O post de Linux abre com a linhagem Unix → GNU → Minix →
Linux e a mensagem original do Torvalds na Usenet **antes** de qualquer comando; o de Hadoop
abre "em um contexto histórico".

> "Em resumo, por mais complexo que possa parecer, é possível afirmar que as coisas surgiram
> 'umas das outras' até que Linus Torvalds, em 25 de agosto de 1991, enviasse a seguinte
> mensagem na *Usenet* (...)."

### 1.5 Honesto sobre o que é denso, chato ou difícil

Não finge que tudo é fácil. Avisa quando um trecho é pesado e **reassegura** que vai clarear —
e valoriza justamente as partes que tutoriais pulam.

> "Por mais complexo que este último parágrafo possa ter parecido, tudo ficará mais claro
> daqui em diante."

> "Por mais denso que o conteúdo aqui consolidado possa ter se apresentado ao leitor (...)."

> "(...) os detalhes chatos que aparecem quando o protótipo vira código que precisa rodar
> amanhã." *(2026)*

### 1.6 Escada pedagógica: um degrau de cada vez, teoria antes da prática

Constrói fundamento antes de aplicar. Sinaliza explicitamente os degraus ("como um primeiro
passo", "um *milestone* de conhecimento", "antes, como de costume, vamos analisar alguns
conceitos teóricos"). O leitor sente a progressão.

> "Em muitas situações semelhantes dentro desta mesma série, assuntos inéditos foram
> introduzidos em etapas e com uma forte fundamentação teórica por trás. Neste caso, a
> abordagem não será diferente (...)."

### 1.7 Perguntas retóricas para virar a chave de um conceito ao próximo

Pivota de um tópico para o seguinte com uma pergunta que o leitor já está se fazendo.

> "Mas, o que significa ser uma ferramenta unificada e qual o impacto prático desta
> característica?"

> "Legal, mas o que se pode esperar desta série? Naveguemos por entre as seções abaixo (...)."

### 1.8 Código tratado com disciplina

O padrão recorrente em tutorial é: **anuncia em lista numerada o que o bloco faz → bloco com
linguagem anotada e comentários `#` em português → resultado → explicação do que aconteceu.**

> "(...) o bloco de código abaixo será responsável por: 1. Importar as bibliotecas (...)
> 2. Definir variáveis (...) 3. Realizar a leitura (...) 4. Validar o *schema* (...)"

- Comandos e código **reais**, nunca pseudocódigo. Comentários em PT-BR dentro do bloco.
- `crase` para identificadores (`SparkSession`, `select()`, `col()`), nomes de arquivo, flags,
  propriedades de config (`spark.executor.cores`).
- No epistemix os blocos são MDX: sempre anote a linguagem (```python, ```bash, ```yaml).

### 1.9 Tabelas para glossários, comparações e planejamento

Quando há vários termos, componentes ou itens a definir, usa tabela (Termo | Definição), não
prosa corrida. Aparece em quase toda série (linhagem do Linux, elementos de uma aplicação
Spark, **estrutura das seções de uma série inteira** na boas-vindas do AWS Labs, registro de
aulas no log semanal).

### 1.10 Cita fontes e credita — SEMPRE fecha com `## Referências`

Regra dura, não enfeite: **todos os 40 posts terminam com uma seção `## Referências`** — lista
de livros (em *blockquote* ou link: Learning Spark, Spark: The Definitive Guide), docs
oficiais, vídeos do YouTube e blogs. Ele aprende em público e mostra o rastro. Um Post sem
Referências não soa como ele.

### 1.11 Ênfase tipográfica consistente

- *Itálico* para anglicismos e jargão estrangeiro: *framework*, *cluster*, *driver*, *deploy*,
  *streaming*, *lazily*, *shuffle*, *broadcasting*, *deep dive*. Ele não traduz o que já é
  consagrado.
- **Negrito** para o termo-âncora de um trecho — com parcimônia: **ferramenta unificada**,
  **ação**, **expressão**, **kernel**.
- `___` (régua horizontal) separando seções é um tique estrutural recorrente. No MDX/epistemix,
  prefira a separação por heading; não force réguas só por hábito.

### 1.12 Parágrafos curtos, uma ideia cada. Fecho que aponta para a frente

Ritmo arejado. O encerramento recapitula o ganho do artigo e **conecta ao próximo passo** ou
à implicação da tese — não é resumo burocrático.

> "Nos próximos artigos, uma maior proximidade às atividades práticas de uso do Spark será
> alcançada e, até lá, tópicos como a instalação e configuração do Spark (...) serão detalhados."

> "Complementando com os detalhes fornecidos pelo primeiro artigo, (...) agora podemos
> desbravar esse universo na prática dando os primeiros passos (...)."

### 1.13 Recap em bullets é legítimo (quando agrega)

Diferente do que um detector de "IA genérica" assumiria, o autor **gosta** de fechar tutorial
denso com uma lista de pontos-chave — e funciona, porque consolida, não só repete.

> "Os DataFrames são compostos por registros do tipo `Row` e atributos do tipo `Column` /
> As referências aos atributos podem ser feitas pelas funções `col()`, `column()` ou `expr()` (...)"

Mantenha o recap **se ele consolidar de verdade**. Corte se for só reescrever os títulos.

### 1.14 Honesto sobre ser um projeto solo, de tempo livre

Gerencia expectativa com franqueza: não promete cadência que não pode manter, e atribui o
ritmo ao fato de ser um trabalho pessoal feito nas horas vagas. Isso é identidade, não
desculpa — faz parte do "aprender em público".

> "Afinal, todo este blog foi pacientemente construído utilizando meu tempo livre (...).
> Podem haver períodos frenéticos de publicação, como também grandes hiatos."

---

## 2. Ritual de 2022 — modernize / corte por padrão

Estes traços são autênticos do corpus, mas são a **cerimônia datada**. O autor pediu "menos
ritual". Por padrão (`eptmx write`), **não reproduza**; substitua pela versão enxuta.

### 2.1 Saudação cerimonial de abertura → abertura direta e substantiva

Quase todo post de Spark abre **idêntico**: *"Olá, caro leitor! Seja bem vindo a mais um
artigo desta importante série sobre Apache Spark (...)"* (a fórmula "Seja (muito) bem vindo"
aparece em ~19 arquivos). Hadoop: *"Bem-vindos a mais um artigo da série (...)"*. Linux
casual: *"Fala, galera!"*. O pico está na boas-vindas do AWS Labs.

→ **Modernizar:** comece pelo problema, pela tese ou por uma frase concreta. Se for série,
**mantenha o elo** ("No post anterior configuramos o servidor; agora vai o Coolify") — esse
recap de série é DNA (§1.4), só sem o "Seja muito bem vindo".

### 2.2 "caro leitor" e o tratamento cerimonial → "você", com parcimônia

O vocativo "caro leitor" / "caros leitores" aparece dezenas de vezes. É a marca registrada de 2022.

→ **Modernizar:** fale com "você" quando precisar, ou sem vocativo. Sem "caro leitor".

### 2.3 Entusiasmo vazio e anúncio pomposo → valor específico

*"maravilhoso framework"*, *"poderosa"*, *"extraordinária"*, *"É com grande alegria e imensa
satisfação que anuncio"*, *"Senhoras e senhores, abram alas"*, *"humilde e aconchegante blog"*,
*"A jornada é promissora!"*, *"vamos nessa!"*. Adjetivo de empolgação sem substância.

→ **Modernizar:** troque o adjetivo pelo que a coisa **faz**. "Spark unifica batch, streaming,
grafos e SQL num motor só" diz mais que "Spark é maravilhoso".

### 2.4 Enchimento formal e conectivo empilhado → corte

*"é de suma importância"*, *"essencialmente fundamental"*, *"de maneira categórica"*, e a
pilha de transições no início de frase: *"De forma direta, (...) Adicionalmente, (...) Em
linhas gerais, (...) Dessa forma, (...)"*.

→ **Modernizar:** uma transição quando muda mesmo de ideia, não em toda frase. Afirme direto.

### 2.5 GIFs e reações de blog casual → corte (ou imagem que informa)

Os posts de série casual (AWS Labs) intercalam GIFs do Giphy/Tenor ("thumbs up", "let's go")
entre seções. É textura de blog de 2022.

→ **Modernizar:** no epistemix, imagem só quando **informa** (diagrama, screenshot de passo).
Sem GIF de reação.

### 2.6 Fecho cerimonial → fecho que aponta para a frente

*"Foi ótimo ter você aqui, caro leitor! Até a próxima! Fique ligado!"*

→ **Modernizar:** termine no próximo passo concreto ou na implicação da tese. Sem despedida
protocolar. (O encerramento que recapitula o ganho e conecta para frente — §1.12 — é DNA,
mantenha.)

### 2.7 Heading genérico de conclusão → heading concreto

O autor usa "## Conclusão e encerramento" / "## Considerações Finais". Funciona, mas é o
rótulo mais previsível possível.

→ **Modernizar:** prefira um heading que seja promessa concreta ("O que você consegue fazer
agora", "Onde isso te leva"). Se a seção for mesmo um fecho neutro, "Conclusão" é tolerável —
mas tente fazer o título trabalhar.

---

## 3. Cheiros de IA genérica (sempre evitar — não são do autor nem do ritual)

- Aberturas tipo "No mundo de hoje, X é mais importante do que nunca".
- Em-dash (—) como pontuação de efeito; prefira vírgula, dois-pontos, parênteses.
- Listas infladas e simétricas onde prosa serviria melhor.
- "não é só X, é Y", "X de verdade", cadência de aforismo repetida.
- Hedging excessivo. O autor afirma o que sabe e admite o que não sabe (§1.1/§1.3) — sem encher
  linguiça de "talvez", "de certa forma", "pode-se dizer que".
- Buzzword de marketing: "revolucionário", "game-changer", "next-level".

---

## 4. Modulação de registro por formato

O corpus mostra o autor ajustando o calor e a densidade pelo contexto. Replicar isso (na chave
moderna):

| Formato | Abertura (modernizada) | Densidade |
| --- | --- | --- |
| **Boas-vindas / lançamento de série** | motivação pessoal + escopo por contraste (§1.3) + plano do que vem (tabela de seções) + convite p/ frente | média; sem código, com tabela de estrutura |
| Tutorial em série | elo curto com o post anterior + tese do post | alta, com código e tabelas |
| Blog post solto | direto na tese ou no problema | média |
| Nota de curso (with_sources) | o que o curso entregou + o ângulo pessoal | média, honesta sobre o aprendizado |
| FAQ / prep de certificação | tema em `##`, pergunta numerada em **negrito**, resposta começando com "R:" | alta, conceitual, pouca prosa de moldura |
| Log / diário (às vezes em inglês) | "Main Purpose" + entradas com tabela por item | baixa, reflexiva, primeira pessoa |
| Review de livro | a tese do livro e se valeu | prosa, pouco código |

> **Nota de curso × boas-vindas:** um post de *motivações e objetivos* que abre uma série de
> notas de curso é, na prática, um **lançamento de série** (linha 1 da tabela) — use aquele
> molde: por que escolhi, escopo por contraste, o que a ementa promete, o que espero aprender,
> e como vou registrar aqui. É o formato da boas-vindas do AWS Labs e da abertura da série Linux.

---

## 5. Como recalibrar quando o corpus crescer (`eptmx calibrate`)

Ao re-destilar, atualize §1 e §2 com padrões **observados e contados**, não impressões. Métricas
da base atual (para comparar na próxima passada):

- **40 posts publicados** + 6 drafts; ~1.900 palavras de média, com *deep dives* de 4–5 mil
  (Guia Definitivo de Transformações, 5.136; Funções Window, 4.587; spark-submit, 4.481).
- **Três séries**: Linux Básico (~13), Hadoop/Big Data (~10), Apache Spark (~18), mais posts
  avulsos de ferramentas e os drafts de formatos novos (FAQ, log, AWS Labs).
- **Abertura por papel do post**: lançamento de série = "Boas vindas e apresentação"; meio de
  série = link de volta ao artigo anterior ("No primeiro artigo desta série..."); Spark =
  "Olá, caro leitor! Seja bem vindo a mais um artigo...".
- **Fecho universal**: `## Conclusão`/`Considerações Finais` (recap + ponteiro p/ frente +
  despedida ritual) seguido de `## Referências`.
- Vocabulário de transição recorrente: "Dessa forma", "Em linhas gerais", "Na prática",
  "De forma direta", "Adicionalmente".

Toda afirmação no STYLE.md precisa de **1–2 trechos curtos como âncora** — é o que torna este
arquivo verificável em vez de palpite. Cite a fonte (série/post) quando ajudar.
