# slides — (roadmap, ainda não implementado)

Marcador de capacidade futura. **Não está implementado.** Existe para sinalizar a direção do
handler e para dar uma resposta honesta quando o autor pedir slides, em vez de improvisar.

## O que vai ser

Gerar uma **apresentação** a partir de um `Post` existente do catálogo — uma `Presentation` no
vocabulário do domínio (apresentações técnicas são um dos artefatos do epistemix; ver
`docs/CONTEXT.md` e `docs/VISION.md`). A ideia: pegar um Post denso e destilar num roteiro de
slides na voz do autor, reaproveitando tese, arco e exemplos já escritos.

## Por que ainda não

- O modelo de `Presentation` no catálogo (schema, onde vive em disco, como valida) **ainda não
  está definido** — diferente de `Post`, que tem schema Zod e tag gate prontos. Sem esse
  contrato, não há como gravar algo que não quebre a build.
- Pelo ROADMAP, conteúdo (Posts) vem antes de novos tipos de artefato. Não antecipar fases
  (AGENTS.md / ADR-0017).

## Se o autor invocar `slides` agora

1. Diga, em uma linha, que é roadmap e por que (o contrato de `Presentation` não existe ainda).
2. Ofereça os caminhos reais:
   - **Especificar primeiro**: destilar um spec em `docs/specs/NNNN-presentations.md` (objetivo
     + critério de aceite + vertical slices) — o jeito certo de abrir a capacidade (ADR-0017).
     Pode usar `grill-with-docs` para alinhar o modelo de `Presentation` com o domínio.
   - **Rascunho informal**: se ele só quer um roteiro de slides solto agora (fora do catálogo,
     sem virar artefato validado), gere em texto/markdown avulso e deixe claro que é provisório,
     não um artefato do hub.
3. Não invente um schema de `Presentation` nem grave arquivos no `content/` como se o tipo
   existisse. Propor e parar.

Quando a `Presentation` for definida no catálogo, este playbook vira o fluxo real (Post → slides
→ self-verify → entregar), espelhando o [write](write.md).
