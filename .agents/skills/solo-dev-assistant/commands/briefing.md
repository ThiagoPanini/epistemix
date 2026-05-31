# Command: briefing

Use this command when the operator invokes `/solo-dev-assistant briefing` or asks for a work-session briefing, panorama, "what is in flight", "what is blocked", or "what can I pick next".

## Behavior

Run the bundled renderer from the repository root:

```bash
python3 <skill-dir>/scripts/briefing.py
```

Return the command's stdout exactly as the operator-facing answer. If the command fails, report the failure in the operator's language and include the failing command.

## Contract

`briefing` is read-only.

It reads:

- `docs/ROADMAP.md`, falling back to `ROADMAP.md`
- local git branches and current branch, when the target is a git repository
- open PRs through `gh pr list`, when `gh` is installed and authenticated
- recent commits touching the roadmap, especially `chore(roadmap):` commits
- the bundled static `skills-map.md`

It never edits files, stages files, commits, creates issues, creates branches, creates PRs, or mutates remote state.

## Output Shape

The renderer emits these sections in the detected project language:

```markdown
## Briefing — <project> @ <phase>

### Em voo / In flight

### Bloqueado / aguardando / Blocked / waiting

### Disponível para pegar (top 5) / Available next (top 5)

### Skills sugeridas / Suggested skills

### Recém-concluído (últimos 7 dias) / Recently completed (last 7 days)
```

Empty sections are rendered as `nada` in Portuguese or `none` in English, rather than omitted.
