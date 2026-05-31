---
name: solo-dev-assistant
description: Use this skill whenever the user invokes `/solo-dev-assistant ...`, asks for a talkingpres work-session briefing, wants to orient a solo-dev session from ROADMAP.md, or needs the ROADMAP/git/PR digest defined by ADR-0014. This is the planning harness for talkingpres; use it for `/solo-dev-assistant briefing` even if the user phrases it casually as "briefing", "panorama", "what is in flight", or "what can I pick next".
---

# Solo Dev Assistant

This skill is the lightweight planning harness described in `docs/adr/0014-roadmap-como-source-skill-solo-dev-assistant.md`.

It is a multi-command framework. Commands live in `commands/`; each command owns its behavior and any helper scripts it needs. The v1 command is:

- `briefing`: read-only session orientation for talkingpres.

Future commands, such as `start`, should be added only after repeated real friction. Do not create new commands speculatively.

## Dispatch

When the operator invokes `/solo-dev-assistant briefing`, read `commands/briefing.md` and follow it exactly.

If the operator invokes an unknown command, answer in Portuguese that only `briefing` is implemented in this local v1. Do not invent behavior for missing commands.

## Operating Principles

- Keep the ROADMAP as the single source of planning state.
- Keep `briefing` read-only: it may read `docs/ROADMAP.md`, local git state, recent roadmap commits, and open PRs via `gh pr list`; it must not edit files, create issues, create branches, or stage changes.
- Prefer deterministic output. The same ROADMAP/git/PR state should produce the same markdown.
- Use Portuguese for operator-facing output. Keep identifiers, command names, branch names, and skill names unchanged.
- Use the static suggestions in `skills-map.md`; do not infer new skill recommendations from vibes.

## Static Resources

- `commands/briefing.md`: command contract and invocation steps.
- `scripts/briefing.py`: deterministic briefing renderer using only Python standard library plus local `git`/`gh` commands.
- `skills-map.md`: static keyword-to-skill map for the "Skills sugeridas" section.
