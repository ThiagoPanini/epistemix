---
name: solo-dev-assistant
description: Use this skill whenever the user invokes `/solo-dev-assistant ...`, wants to bootstrap a solo project, asks for a work-session briefing, wants to know what to do next, or needs a lightweight AI-assisted solo development process. This skill is a global, portable wrapper for solo work: it creates seed docs, reads roadmap/git state, and recommends the next process step across Start, Grill, Research, Prototype, PRD, Issues, Implement, and Review.
---

# Solo Dev Assistant

`solo-dev-assistant` is a lightweight process wrapper for solo development with AI agents. It is intentionally portable: it should work in any repository that uses Markdown docs and git, without depending on one project, board, issue tracker, or vendor workflow.

It composes with specialized skills instead of replacing them. Use it to create initial project footing, orient a work session, and decide which specialized skill or workflow should come next.

## Commands

Commands live in `commands/`; each command owns its behavior and helper scripts.

- `start`: bootstrap a greenfield project by asking a small intake and generating seed documentation.
- `briefing`: render a deterministic, read-only session digest from the local roadmap, git state, and PRs when available.
- `cycle`: diagnose the likely process phase and recommend the next movement without mutating project state.

Future commands should be added only after repeated real friction. Do not create commands just because the seven-phase process has a name for something.

## Dispatch

When the operator invokes `/solo-dev-assistant start`, read `commands/start.md` and follow it exactly.

When the operator invokes `/solo-dev-assistant briefing`, read `commands/briefing.md` and follow it exactly.

When the operator invokes `/solo-dev-assistant cycle`, read `commands/cycle.md` and follow it exactly.

If the operator invokes an unknown command, answer in the operator's language that only `start`, `briefing`, and `cycle` are implemented in this v1. Do not invent behavior for missing commands.

## Operating Principles

- Treat Markdown docs as the shared memory between humans and agents. Prefer `docs/ROADMAP.md` or `ROADMAP.md` for lightweight planning state.
- Do not create private tracking state for this skill. No `.solo-dev/state.json`, hidden databases, or tool-specific ledgers in v1.
- Keep `start` modest. It creates seed docs only; it does not create product code, PRDs, issues, ADRs, boards, branches, or remote resources.
- Keep `briefing` read-only. It may read the roadmap, local git state, recent commits, and open PRs through `gh pr list`; it must not edit files, stage changes, commit, create issues, create branches, or mutate remote state.
- Keep `cycle` read-only by default. It may propose a roadmap edit, but the agent must ask for explicit confirmation before making that edit.
- Use evidence, not vibes. `cycle` should name the files, markers, TODOs, diffs, PRs, or missing artifacts that drove its recommendation.
- Recommend specialized skills and workflows; do not invoke them automatically. The operator stays in control of the next move.
- Use the language of the project docs or the operator's prompt. If uncertain, prefer the user's current language.
- Prefer deterministic output. The same docs/git/PR state should produce the same briefing and cycle recommendation.
- Use the static suggestions in `skills-map.md`; do not infer new skill recommendations from vibes.

## Process Model

The internal process map is inspired by lightweight agentic development workflows:

1. Start — create initial footing for a new project.
2. Grill — resolve requirements, scope, and decision dependencies.
3. Research — investigate external APIs, approaches, risks, or unknowns.
4. Prototype — answer a question with throwaway code or visible variations.
5. PRD — turn resolved context into a spec or milestone brief.
6. Issues — decompose the spec into thin vertical slices.
7. Implement — let the agent ship one executable slice.
8. Review — evaluate the diff, PR, tests, security, and fit to the original intent.

These are not v1 commands. `cycle` uses them as diagnostic states and recommends the next specialized tool.

## Static Resources

- `commands/start.md`: command contract, adaptive questioning flow, generation rules, and handoff.
- `commands/briefing.md`: read-only briefing contract and output shape.
- `commands/cycle.md`: read-only cycle diagnosis contract and output shape.
- `scripts/start.py`: deterministic seed-doc renderer using only Python standard library.
- `scripts/briefing.py`: deterministic briefing renderer using only Python standard library plus local `git`/`gh` commands.
- `scripts/cycle.py`: deterministic process-phase recommender using local docs, git, and optional `gh`.
- `skills-map.md`: static keyword-to-skill map for recommendation sections.
- `templates/*.tmpl`: markdown templates used by `start`.
