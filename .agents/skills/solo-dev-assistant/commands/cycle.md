# Command: cycle

Use this command when the operator invokes `/solo-dev-assistant cycle`, asks "what should I do next?", wants to locate the current phase of the solo development process, or needs a lightweight recommendation for which skill/workflow to use next.

## Behavior

Run the bundled renderer from the repository root:

```bash
python3 <skill-dir>/scripts/cycle.py
```

Return the command's stdout exactly as the operator-facing answer. If the command fails, report the failure in the operator's language and include the failing command.

## Contract

`cycle` is read-only by default.

It may read:

- `README.md`
- `AGENTS.md`
- `docs/VISION.md`
- `docs/ROADMAP.md`, falling back to `ROADMAP.md`
- `docs/CONTEXT.md`, falling back to `CONTEXT.md`
- local git status, branches, and open PRs through `gh pr list` when available
- local spec/PRD/slice files when they exist
- the bundled static `skills-map.md`

It never edits files, stages files, commits, creates issues, creates branches, creates PRs, or mutates remote state.

If it proposes a roadmap edit, it must present the edit as a proposal only. The agent must ask for explicit confirmation before making any state transition.

## Diagnostic Model

Diagnose by evidence, not vibes:

- Missing seed docs -> `Start`
- Seed docs, TODOs, unresolved scope, or provisional roadmap -> `Grill`
- Domain language missing or unstable -> `Grill` with `grill-with-docs` / `domain-model`
- Technical unknown, external API uncertainty, or approach uncertainty -> `Research`
- A question needs to be seen or tested with throwaway code -> `Prototype`
- Context is resolved but no PRD/spec exists -> `PRD`
- PRD/spec exists but no slices/issues exist -> `Issues`
- Executable slice or roadmap item is in progress -> `Implement`
- Local diff, current feature branch, or open PR exists -> `Review`

If evidence is weak, say the phase is uncertain and recommend the smallest next clarifying step.

## Output Shape

The renderer emits these sections in the detected project language:

```markdown
## Cycle — <project>

### Fase provável / Likely phase

### Evidências / Evidence

### Próximo movimento / Next movement

### Skill ou workflow recomendado / Recommended skill or workflow

### Prompt sugerido / Suggested prompt

### Edição opcional de roadmap / Optional roadmap edit
```
