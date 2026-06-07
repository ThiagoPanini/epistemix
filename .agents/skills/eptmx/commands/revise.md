# revise — calibra um draft existente

Pega um Post que já existe (escrito pela skill, pelo autor, ou colado de outro lugar) e o deixa
**soando como o autor e válido no catálogo**. É o loop de iteração: cada passada também é
material para refinar `references/STYLE.md`.

```
Localizar → Diagnosticar → Propor o plano → Aplicar → Self-verify → Entregar (+ realimentar a voz)
```

## 1. Localizar o alvo

O argumento é um caminho de `.mdx`, um slug, ou "esse draft" (o último que vocês mexeram / o
arquivo sujo no git). Se ambíguo, pergunte qual. Leia o arquivo inteiro antes de tocar.

## 2. Diagnosticar (contra STYLE.md e catalog-model.md)

Liste os problemas, agrupados — não reescreva ainda. Procure:

- **Ritual de 2022 a modernizar** (STYLE §2): saudação "Olá, caro leitor…", entusiasmo vazio
  ("maravilhoso/poderoso"), enchimento formal, despedida cerimonial, heading "Conclusão" genérico.
- **Cheiros de IA genérica** (STYLE §3): em-dash de efeito, "não é só X, é Y", hedging, buzzword.
- **DNA ausente** (STYLE §1): abre sem declarar o objetivo? Mecanismo antes do contexto? Código
  sem o "anuncia → bloco → explica"? Fecho que não aponta para a frente?
- **Contrato do catálogo** (catalog-model.md): frontmatter com os cinco campos exatos?
  `status: draft`? Toda tag em `tags.yml`? Arquivo no path que expressa o vínculo certo? Slug ok?
- **Concretude**: afirmações técnicas sem fundamentação, ou passos que não fecham → candidatos a
  `> TODO:` (nunca invente para tapar buraco).

## 3. Propor o plano

Mostre ao autor o diagnóstico e o que você pretende mudar, em bullets curtos. Se ele pediu um
tom específico (ex.: "quero o registro caloroso de série"), ajuste o default da doutrina de voz
a esse pedido. Espere o OK antes de reescrever em peso. Correções pequenas e óbvias (uma tag
faltando, `status` errado) pode aplicar direto e avisar.

## 4. Aplicar

Reescreva preservando o DNA e cortando o ritual. **Não troque a substância técnica do autor** —
calibrar voz não é reescrever o conteúdo. Mantenha os fatos, exemplos e código dele; mude como
soam. Se uma adição de tag for necessária, proponha e só grave após OK (gate fechado, §3 do write).

## 5. Self-verify

```bash
cd apps/web && pnpm vitest run lib/catalog
```

Verde antes de entregar. Sem `pnpm`, confira à mão (cinco campos, tags, path, `status: draft`).

## 6. Entregar e realimentar a voz

Resuma o que mudou e por quê (ligando a STYLE §1/§2/§3), o resultado do self-verify, e os
`> TODO:` restantes. **Realimentação:** se o autor reverter ou recusar alguma mudança de voz,
isso é sinal de que `references/STYLE.md` está calibrado errado naquele ponto — ofereça
atualizar o STYLE.md (ou rode [calibrate](calibrate.md)) para a correção valer nas próximas vezes.
