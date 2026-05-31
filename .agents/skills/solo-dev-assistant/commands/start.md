# Command: start

Use this command when the operator invokes `/solo-dev-assistant start` to bootstrap a new greenfield project.

`start` is not for talkingpres itself. It creates seed documentation so downstream skills can refine it; it does not try to finish product strategy.

## Contract

`start` may write only the five templated markdown files under the target project's `docs/` directory:

- `README.md`
- `VISION.md`
- `ROADMAP.md`
- `AGENTS.md`
- `CONTEXT.md`

It does not create ADRs, issues, branches, product code, lessons, guides, runbooks, or ai-ops docs.

Do not run it in the talkingpres repository except for smoke tests in `/tmp/test-start-<timestamp>/`.

## Adaptive Interaction

Ask no more than three rounds.

### Round 1: required

Ask these three questions, preferably together:

1. Em uma frase, que problema esse projeto resolve?
2. Para quem?
3. Como saber que V1 deu certo?

After the answers, evaluate two things:

- Specificity: answers should contain concrete noun phrases, not only generic words such as "software", "sistema", "app", "plataforma", "desenvolvedores", "usuários", "pronto", or "funcionando".
- Sufficiency for templates: the five docs can be generated without hiding missing information.

If the answers are sufficient, generate the docs.

### Round 2: conditional, max 2 questions

If one or two answers are shallow, ask focused questions for the weakest points only.

Examples:

- If audience is "desenvolvedores": "Que tipo de desenvolvedor — full-stack web, mobile, DevOps, ML, embarcados, outro?"
- If V1 success is "estar pronto": "Em concreto: quantos usuários ativos, quais fluxos funcionando, e precisa estar em produção ou só local?"
- If problem is "organizar coisas": "Que coisas, em qual contexto, e qual dor aparece hoje?"

Do not ask more than two questions in this round.

### Round 3: rare, max 2 questions

Ask only if anti-scope or stack are still blocking obvious template slots:

- "O que esse projeto explicitamente NÃO é?"
- "Stack já decidida? Se sim, qual; se não, deixaremos para `/grill-me` decidir depois."

If ambiguity remains after this round, generate the docs anyway with visible `_TODO_` slots.

## Generation

From the collected answers, run the bundled renderer from the target project root:

```bash
python3 <skill-dir>/scripts/start.py --target "$PWD" --answers-json <answers.json>
```

The JSON should use these keys:

```json
{
  "project_name": "nome-do-projeto",
  "problem": "problema em uma frase",
  "audience": "publico alvo",
  "v1_success": "criterio concreto de sucesso da V1",
  "anti_scope": "o que nao e",
  "stack": "stack decidida ou vazio",
  "non_functionals": "atributos nao-funcionais discutidos ou vazio"
}
```

If a key is unknown, omit it. The renderer turns missing optional values into visible `_TODO_` markers rather than inventing content.

If any destination file already exists, stop and ask before rerunning with `--force`.

## Final Output

After generation, show this handoff in Portuguese, preserving the file list:

```markdown
✓ 5 documentos gerados em ./docs/:
  - README.md
  - VISION.md
  - ROADMAP.md
  - AGENTS.md
  - CONTEXT.md (esqueleto)

Próximos passos sugeridos:
  1. Refinar VISION/ROADMAP com mais profundidade → /grill-me
  2. Preencher CONTEXT.md (glossário, invariantes) → /grill-with-docs
  3. Quando começar a executar → /solo-dev-assistant briefing
  4. Iniciar repositório git e ADR-0001 com decisões fundacionais
```
