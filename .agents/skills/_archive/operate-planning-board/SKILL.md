---
name: operate-planning-board
description: Operates the talkingpres GitHub Projects planning board protocol for agent work. Use when an agent needs to discover, claim, update, submit, or report work on the board, or when the user asks to move planning-board state.
---

# Operate Planning Board

The board (GitHub Projects v2) holds **live status only** — it is a visibility instrument, not a work cockpit. Strategy stays in `ROADMAP.md`, task spec stays in the issue body, decisions/code stay in PRs/docs. Operate the board through the **GitHub MCP server** (`projects` toolset). Do not call the Projects GraphQL/REST API directly and do not shell out to `gh project` for writes — use the MCP tools so the operation is identical across Claude Code, Codex, and Copilot.

The decision and the why are in [ADR-0013](../../../docs/adr/0013-substrato-de-planejamento-operado-por-agentes.md); branch/merge gates come from [ADR-0005](../../../docs/adr/0005-deploy-checks-em-tres-portoes.md); evergreen principles in [lesson 0002](../../../docs/lessons/0002-harness-basico-em-github-projects.md). Day-to-day commands are in [runbook 0002](../../../docs/runbooks/0002-harness-agente-solo.md).

## Prerequisite

GitHub MCP server installed with the `projects` toolset enabled (it is **not** on by default) and a token with `project` scope. Project: `talkingpres — roadmap` (owner `ThiagoPanini`, number `4`).

## Data model

Two orthogonal fields, and only two:

- **`Status`** (lifecycle): `Backlog` · `In progress` · `In review` · `Done`.
- **`Owner`** (routing intent): `Human` · `Agent` · `Pairing`. This says who *should* do it; the native issue **assignee** says who *is* doing it.

Special states are labels, not columns: `someday` (parked/immature, filtered out of the default view) and `blocked` (stalled on something external).

## Lifecycle

1. **Discovery.** Use `projects_get` to read board items; filter for `Status=Backlog`, `Owner∈{Agent,Pairing}`, current `phase-N` label, and not `someday`/`blocked`.
2. **Claim.** Assign the issue to yourself (the agent's GitHub user) and set `Status=In progress` via `projects_write`. Comment `claimed @ <utc-ts>` on the issue, then reread to confirm assignee + status stuck.
3. **Plan.** Comment the execution plan on the issue before coding. This is the human checkpoint.
4. **Execute.** Branch following ADR-0005 (`^(feat|fix|chore|docs)/<scope>-<slug>`). When agents may run in parallel, work in a git worktree partitioned by domain boundary (ADR-0001) to avoid merge conflicts. Keep work scoped to the issue.
5. **Submit.** Open a PR with `Closes #N`, then set `Status=In review` via `projects_write`.
6. **Review/Merge.** The human reviews and merges. The agent never merges. `PR merged → Done` is built-in.
7. **Block.** If you hit an external blocker (human decision, secret, registrar/DNS, production), add the `blocked` label + a comment explaining what is needed, set `Owner=Human`, and move `Status` back to `Backlog` (leaving `In progress` honest). Do not sit in `In progress` while stalled.

Tasks with no PR (human/infra work) go `Backlog → In progress → Done` directly — the operator closes the issue (`issue closed → Done` is built-in). `In review` only applies to PR-producing work. PR rejected in review goes `In review → In progress`, not blocked.

## Writing a single-select field via MCP (the one gotcha)

`projects_write` needs the **field id** and the **option id**, not the text. Resolve them first with `projects_get` (its read of a single-select field returns its `options` with ids), then write. Pattern:

1. `projects_get` the project → find the `Status` (or `Owner`) field id and the id of the target option (e.g. `In progress`).
2. `projects_write` the item with the resolved `{field id, option id}`.

## Hard gates

- **Never merge a PR.** Merge is the hard human gate (ADR-0005).
- **Never touch secrets, registrar/DNS, production credentials, or production state.** Add `blocked`, hand off to `Owner=Human`.
- **Never promote `someday`/`proposed` work to the ready queue.** Backlog curation is human-gated; you may *propose* a new issue (it lands with the `proposed` label) but not accept it.
- **Never reimplement built-in board automations:** item added → `Backlog`, issue/PR closed → `Done`, PR merged → `Done` belong to GitHub Projects configuration.
- **Do not delegate to the cloud (Agent HQ / claude-code-action) on your own** — that is a documented, paid overflow requiring a human decision and an ADR.
