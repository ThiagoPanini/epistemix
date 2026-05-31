# Command: briefing

Use this command when the operator invokes `/solo-dev-assistant briefing` or asks for the ADR-0014 session briefing.

## Behavior

Run the bundled renderer from the repository root:

```bash
python3 .agents/skills/solo-dev-assistant/scripts/briefing.py
```

Return the command's stdout exactly as the operator-facing answer. If the command fails, report the failure in Portuguese and include the failing command.

## Contract

`briefing` is read-only.

It reads:

- `docs/ROADMAP.md`
- local git branches
- open PRs through `gh pr list`, when `gh` is installed and authenticated
- recent roadmap commits through `git log --grep "chore(roadmap):" --since="7 days ago"`

It never edits `ROADMAP.md`, stages files, commits, creates issues, creates branches, or mutates remote state.

## Output Shape

The renderer emits exactly these sections:

```markdown
## Panorama — talkingpres @ Fase <N>

### Em voo

### Bloqueado / aguardando você

### Disponível para pegar (top 5)

### Skills sugeridas para esta sessão

### Recém-concluído (últimos 7 dias)
```

Empty sections are rendered as `nada`, rather than omitted.
