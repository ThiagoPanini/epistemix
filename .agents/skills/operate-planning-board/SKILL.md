---
name: operate-planning-board
description: Operates the talkingpres GitHub Projects planning board protocol for agent work. Use when an agent needs to discover, claim, plan, update, submit, or block work on the board, or when the user asks to move planning-board state.
---

# Operate Planning Board

## Quick Start

```bash
gh auth refresh -s project
export TP_PROJECT_OWNER=ThiagoPanini
export TP_PROJECT_NUMBER=<project-number>

.agents/skills/operate-planning-board/scripts/claim <issue#>
.agents/skills/operate-planning-board/scripts/submit <issue#>
.agents/skills/operate-planning-board/scripts/block <issue#> "what needs human input"
```

Use the scripts for deterministic board writes. Do not call the Projects API directly except to debug these scripts. The protocol and why it exists are recorded in [ADR-0013](../../../docs/adr/0013-substrato-de-planejamento-operado-por-agentes.md); the branch and merge gates come from [ADR-0005](../../../docs/adr/0005-deploy-checks-em-tres-portoes.md).

## When To Invoke

Invoke this skill before an agent discovers work, claims an issue, comments an execution plan, changes board status, opens the PR for a task, or reports a blocker. The board stores live status only; strategy stays in `ROADMAP.md`, task spec stays in issues, and decisions/code stay in PRs/docs.

## Lifecycle

1. Discovery: list board items with `Status=Todo`, current `Phase`, and `Owner` in `Agent` or `Pairing`.
2. Claim: run `scripts/claim <issue#>`. It assigns the issue to the current GitHub user, moves status to `In progress`, comments `claimed @ <ts>`, and rereads the claim.
3. Plan: comment the execution plan on the issue before coding. This is the human checkpoint.
4. Execute: create a branch following ADR-0005, commit normally, and keep work scoped to the issue.
5. Submit: run `scripts/submit <issue#>`. It pushes the current branch if needed, opens a PR with `Closes #N`, and moves status to `In review`.
6. Review/Merge: the human reviews and merges. The agent never merges.
7. Block: run `scripts/block <issue#> "<reason>"` when blocked on a human decision, secret, registrar, or production state.

## State Machine

`Backlog` --human triage--> `Todo` --claim--> `In progress` --PR opened--> `In review` --human merge--> `Done`.

`Blocked` is only for external blockers: human input, secrets, registrar, production, or another irreversible action. Review rework goes from `In review` back to `In progress`, not to `Blocked`.

Collisions are a non-goal for current use. Claim uses assignee plus status as a visible record, then rereads. There is no mutex or lock.

## Hard Gates

- Never merge a PR. Merge is the hard human gate.
- Never touch secrets, registrar, production credentials, or production state. Block and hand off to `Owner=Human`.
- Never promote `Backlog`/`proposed` work to `Todo`; backlog curation is human-gated.
- Never reimplement built-in board automations: item added -> `Todo`, issue/PR closed -> `Done`, and PR merged -> `Done` belong to GitHub Projects configuration.

## Script Configuration

Defaults target the production board:

- `TP_PROJECT_OWNER`: defaults to the repository owner.
- `TP_PROJECT_NUMBER`: preferred; otherwise scripts try `TP_PROJECT_TITLE`, defaulting to `talkingpres — roadmap`.
- `TP_STATUS_FIELD`: defaults to `Status`.
- `TP_OWNER_FIELD`: defaults to `Owner`.
- `TP_PR_BASE`: defaults to the repository default branch.
- `TP_PR_DRAFT=1`: makes `submit` open a draft PR.

The helper `scripts/set-single-select <issue#> <field> <option>` resolves project ID, item ID, field ID, and option ID, then sets one Projects v2 single-select field.
