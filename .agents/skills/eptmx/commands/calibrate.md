# calibrate — re-destila a voz a partir do corpus

Atualiza `references/STYLE.md` lendo amostras reais do autor. Rode quando o corpus crescer (novo
export do Hashnode, posts novos no repo) ou quando o autor reverter mudanças de voz no
[revise](revise.md) — sinal de que algum traço está calibrado errado.

## 1. Reunir o corpus

Fontes, em ordem de preferência:

- **Backup do Hashnode**: repo irmão `../hashnode-backup` (40 publicados + 6 drafts de 2022, base da v2).
- **Posts atuais do repo**: `content/**/*.mdx` (a voz moderna; ex.: aihero/primeiras-impressoes).
- **`corpus/`** da skill, se algum dia for populado.
- **Export novo do Hashnode**: rode o conversor primeiro — `node scripts/hashnode-to-corpus.mjs
  <export.json>` (ver `corpus/README.md`) — e aponte para a saída.

Confirme com o autor qual conjunto usar se houver mais de um candidato.

## 2. Destilar com método (não impressão)

Leia uma amostra ampla e variada (não só um formato). Para cada traço, **conte e ancore**:

- Comprimento médio de post e de parágrafo; densidade de código vs. prosa.
- Fórmulas recorrentes de **abertura** e **fecho**, por série/formato.
- Vocabulário de transição característico; tiques de ênfase (itálico p/ anglicismo, negrito).
- Como abre e encerra uma **série** inteira vs. um post solto.
- O que é **DNA** (alma, recorrente em todas as épocas) vs. **ritual** datado (preso a 2022).

Toda afirmação no STYLE.md precisa de **1–2 trechos curtos como âncora** — é o que torna o
arquivo verificável em vez de palpite.

## 3. Reescrever STYLE.md preservando a estrutura

Mantenha a arquitetura atual do `references/STYLE.md`: **§1 DNA (preserve)**, **§2 ritual
(modernize)**, §3 cheiros de IA, §4 modulação por formato, §5 método. Atualize o conteúdo de
cada seção com os padrões observados; não troque a estrutura sem motivo. Respeite a doutrina
"mesma alma, menos ritual" como default — a menos que o autor redefina.

## 4. Mostrar o diff conceitual

Não entregue só o arquivo novo. Resuma **o que mudou na voz** e por quê: traços novos
detectados, âncoras trocadas, o que migrou de ritual para DNA (ou vice-versa). O autor precisa
reconhecer a calibragem como dele. Ajuste a partir do feedback — calibrar voz é um loop.
