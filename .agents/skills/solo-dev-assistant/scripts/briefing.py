#!/usr/bin/env python3
"""Render the ADR-0014 talkingpres session briefing.

The script is intentionally small and read-only. It derives every section from
ROADMAP.md plus local git/gh state so repeated runs over the same inputs are
stable.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path


PHASE_RE = re.compile(r"^##\s+Fase\s+(?P<number>\d+)\s+[—-]\s+(?P<title>.+?)\s*$")
TASK_RE = re.compile(r"^(?P<indent>\s*)-\s+\[(?P<box>[ xX])\]\s+(?P<body>.+?)\s*$")
OWNER_RE = re.compile(r"`@(?P<owner>human|agent|pairing)`")
WAITING_RE = re.compile(r"\(aguardando:\s*(?P<reason>[^)]+)\)")
STOPWORDS = {
    "a",
    "as",
    "com",
    "da",
    "de",
    "do",
    "dos",
    "e",
    "em",
    "na",
    "no",
    "o",
    "os",
    "para",
    "por",
    "the",
}


@dataclass(frozen=True)
class Task:
    line_number: int
    indent: int
    body: str
    title: str
    done: bool
    in_progress: bool
    waiting_reason: str | None
    owner: str | None
    child_unfinished_count: int = 0

    @property
    def blocked(self) -> bool:
        return self.in_progress and self.waiting_reason is not None

    @property
    def available(self) -> bool:
        return not self.done and not self.in_progress


@dataclass(frozen=True)
class Phase:
    number: str
    title: str
    tasks: list[Task]


def run(cmd: list[str], cwd: Path, timeout: int = 5) -> str:
    result = subprocess.run(
        cmd,
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        timeout=timeout,
        check=False,
    )
    if result.returncode != 0:
        return ""
    return result.stdout.strip()


def repo_root() -> Path:
    here = Path.cwd()
    discovered = run(["git", "rev-parse", "--show-toplevel"], here)
    return Path(discovered) if discovered else here


def clean_title(body: str) -> tuple[str, str | None, str | None]:
    owner_match = OWNER_RE.search(body)
    waiting_match = WAITING_RE.search(body)
    owner = owner_match.group("owner") if owner_match else None
    waiting_reason = waiting_match.group("reason").strip() if waiting_match else None

    title = body.replace("🚧", " ")
    title = WAITING_RE.sub(" ", title)
    title = OWNER_RE.sub(" ", title)
    title = re.sub(r"\s+", " ", title)
    title = title.strip(" -—")
    return title, owner, waiting_reason


def parse_tasks(lines: list[str], start_line: int = 1) -> list[Task]:
    parsed: list[Task] = []
    for offset, line in enumerate(lines):
        match = TASK_RE.match(line)
        if not match:
            continue
        body = match.group("body")
        title, owner, waiting_reason = clean_title(body)
        parsed.append(
            Task(
                line_number=start_line + offset,
                indent=len(match.group("indent")),
                body=body,
                title=title,
                done=match.group("box").lower() == "x",
                in_progress="🚧" in body,
                waiting_reason=waiting_reason,
                owner=owner,
            )
        )

    with_counts: list[Task] = []
    for index, task in enumerate(parsed):
        child_count = 0
        for candidate in parsed[index + 1 :]:
            if candidate.indent <= task.indent:
                break
            if not candidate.done:
                child_count += 1
        with_counts.append(
            Task(
                line_number=task.line_number,
                indent=task.indent,
                body=task.body,
                title=task.title,
                done=task.done,
                in_progress=task.in_progress,
                waiting_reason=task.waiting_reason,
                owner=task.owner,
                child_unfinished_count=child_count,
            )
        )
    return with_counts


def parse_phases(roadmap: str) -> list[Phase]:
    lines = roadmap.splitlines()
    headings: list[tuple[int, re.Match[str]]] = []
    for index, line in enumerate(lines):
        match = PHASE_RE.match(line)
        if match:
            headings.append((index, match))

    phases: list[Phase] = []
    for heading_index, (line_index, match) in enumerate(headings):
        next_index = headings[heading_index + 1][0] if heading_index + 1 < len(headings) else len(lines)
        section_lines = lines[line_index + 1 : next_index]
        tasks = parse_tasks(section_lines, start_line=line_index + 2)
        phases.append(Phase(number=match.group("number"), title=match.group("title"), tasks=tasks))
    return phases


def active_phase(phases: list[Phase]) -> Phase:
    for phase in phases:
        if any(not task.done for task in phase.tasks):
            return phase
    return phases[-1] if phases else Phase(number="?", title="sem fase", tasks=[])


def normalize(text: str) -> list[str]:
    ascii_text = (
        unicodedata.normalize("NFKD", text)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )
    return [token for token in re.findall(r"[a-z0-9]+", ascii_text) if token not in STOPWORDS and len(token) > 1]


def score(text_a: str, text_b: str) -> int:
    return len(set(normalize(text_a)) & set(normalize(text_b)))


def local_feature_branches(root: Path) -> list[str]:
    output = run(["git", "for-each-ref", "--format=%(refname:short)", "refs/heads"], root)
    branches = [line.strip() for line in output.splitlines() if line.strip()]
    feature_re = re.compile(r"^(feat|fix|chore|docs|refactor|test)/.+")
    return sorted(branch for branch in branches if feature_re.match(branch))


def current_branch(root: Path) -> str:
    return run(["git", "branch", "--show-current"], root)


def open_prs(root: Path) -> list[dict[str, str]]:
    if shutil.which("gh") is None:
        return []
    fields = "number,title,headRefName,isDraft,reviewDecision,url"
    output = run(["gh", "pr", "list", "--json", fields, "--limit", "50"], root, timeout=10)
    if not output:
        return []
    try:
        prs = json.loads(output)
    except json.JSONDecodeError:
        return []
    return sorted(prs, key=lambda item: int(item.get("number", 0)))


def review_waiting(pr: dict[str, str]) -> bool:
    return pr.get("reviewDecision") in {"REVIEW_REQUIRED", "CHANGES_REQUESTED"}


def pr_label(pr: dict[str, str]) -> str:
    number = pr.get("number")
    title = pr.get("title", "sem titulo")
    url = pr.get("url", "")
    head = pr.get("headRefName", "")
    state = "draft" if pr.get("isDraft") else "aberto"
    link = f"[PR #{number}]({url})" if url else f"PR #{number}"
    suffix = f" — branch `{head}`, {state}" if head else f" — {state}"
    return f"{link}: {title}{suffix}"


def best_pr_for_task(task: Task, prs: list[dict[str, str]]) -> dict[str, str] | None:
    scored = [
        (score(task.title, f"{pr.get('title', '')} {pr.get('headRefName', '')}"), pr)
        for pr in prs
    ]
    scored = [(value, pr) for value, pr in scored if value >= 2]
    if not scored:
        return None
    return sorted(scored, key=lambda item: (-item[0], int(item[1].get("number", 0))))[0][1]


def best_branch_for_task(task: Task, branches: list[str], current: str) -> str | None:
    candidates = branches[:]
    if current and current not in candidates and re.match(r"^(feat|fix|chore|docs|refactor|test)/.+", current):
        candidates.append(current)
    scored = [(score(task.title, branch), branch) for branch in candidates]
    scored = [(value, branch) for value, branch in scored if value >= 1]
    if not scored:
        return None
    return sorted(scored, key=lambda item: (-item[0], item[1]))[0][1]


def reference_for_task(task: Task, prs: list[dict[str, str]], branches: list[str], current: str) -> tuple[str, int | None]:
    pr = best_pr_for_task(task, prs)
    branch = best_branch_for_task(task, branches, current)
    pieces: list[str] = []
    matched_pr_number: int | None = None
    if pr:
        matched_pr_number = int(pr.get("number", 0))
        pieces.append(pr_label(pr))
    if branch and (not pr or branch != pr.get("headRefName")):
        pieces.append(f"branch `{branch}`")
    return ("; ".join(pieces) if pieces else "sem branch/PR detectado"), matched_pr_number


def recent_roadmap_commits(root: Path) -> list[str]:
    output = run(
        [
            "git",
            "log",
            "--grep",
            "chore(roadmap):",
            "--since=7 days ago",
            "--format=%s",
            "--",
            "docs/ROADMAP.md",
        ],
        root,
    )
    commits = []
    for line in output.splitlines():
        subject = re.sub(r"^chore\(roadmap\):\s*", "", line).strip()
        if subject:
            commits.append(subject)
    return commits


def load_skill_map(root: Path) -> list[tuple[str, list[str]]]:
    path = root / ".agents/skills/solo-dev-assistant/skills-map.md"
    if not path.exists():
        return []
    entries: list[tuple[str, list[str]]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"-\s+`(?P<skill>[^`]+)`:\s+(?P<patterns>.+)$", line)
        if not match:
            continue
        patterns = [part.strip() for part in match.group("patterns").split(",") if part.strip()]
        entries.append((match.group("skill"), patterns))
    return entries


def suggested_skills(tasks: list[Task], skill_map: list[tuple[str, list[str]]]) -> list[str]:
    suggestions: list[str] = []
    seen: set[tuple[str, str]] = set()
    for task in tasks:
        normalized_title = " ".join(normalize(task.title))
        for skill, patterns in skill_map:
            if any(" ".join(normalize(pattern)) in normalized_title for pattern in patterns):
                key = (task.title, skill)
                if key not in seen:
                    suggestions.append(f'- Para "{task.title}": `{skill}`')
                    seen.add(key)
                break
    return suggestions


def available_line(index: int, task: Task) -> str:
    owner = f" `@{task.owner}`" if task.owner else ""
    context = ""
    if task.child_unfinished_count:
        label = "subtarefa" if task.child_unfinished_count == 1 else "subtarefas"
        context = f" — destrava {task.child_unfinished_count} {label}"
    return f"{index}. {task.title}{owner}{context}"


def render() -> str:
    root = repo_root()
    roadmap_path = root / "docs/ROADMAP.md"
    if not roadmap_path.exists():
        raise FileNotFoundError("docs/ROADMAP.md nao encontrado")

    phases = parse_phases(roadmap_path.read_text(encoding="utf-8"))
    phase = active_phase(phases)
    prs = open_prs(root)
    branches = local_feature_branches(root)
    current = current_branch(root)

    in_flight = [task for task in phase.tasks if task.in_progress and not task.blocked]
    blocked = [task for task in phase.tasks if task.blocked]
    available = [task for task in phase.tasks if task.available and task.child_unfinished_count == 0]

    lines: list[str] = [f"## Panorama — talkingpres @ Fase {phase.number}", ""]

    lines.extend(["### Em voo"])
    matched_prs: set[int] = set()
    if in_flight:
        for task in in_flight:
            reference, matched_pr = reference_for_task(task, prs, branches, current)
            if matched_pr:
                matched_prs.add(matched_pr)
            lines.append(f"- {task.title} 🚧 — {reference}")
    for pr in prs:
        number = int(pr.get("number", 0))
        if number in matched_prs or review_waiting(pr):
            continue
        lines.append(f"- {pr_label(pr)}")
    if lines[-1] == "### Em voo":
        lines.append("nada")
    lines.append("")

    lines.extend(["### Bloqueado / aguardando você"])
    if blocked:
        for task in blocked:
            lines.append(f"- {task.title} 🚧 (aguardando: {task.waiting_reason})")
    for pr in prs:
        if not review_waiting(pr):
            continue
        review_state = "mudanças solicitadas" if pr.get("reviewDecision") == "CHANGES_REQUESTED" else "aguardando revisão"
        lines.append(f"- {pr_label(pr)} — {review_state}")
    if lines[-1] == "### Bloqueado / aguardando você":
        lines.append("nada")
    lines.append("")

    lines.extend(["### Disponível para pegar (top 5)"])
    if available:
        for index, task in enumerate(available[:5], start=1):
            lines.append(available_line(index, task))
        remaining = len(available) - 5
        if remaining > 0:
            lines.append(f"(+{remaining} mais no ROADMAP)")
    else:
        lines.append("nada")
    lines.append("")

    lines.extend(["### Skills sugeridas para esta sessão"])
    suggestions = suggested_skills(in_flight, load_skill_map(root))
    lines.extend(suggestions if suggestions else ["nada"])
    lines.append("")

    lines.extend(["### Recém-concluído (últimos 7 dias)"])
    recent = recent_roadmap_commits(root)
    lines.extend([f"- {item}" for item in recent] if recent else ["nada"])

    return "\n".join(lines)


def main() -> int:
    try:
        print(render())
    except Exception as exc:  # noqa: BLE001 - operator-facing smoke command
        print(f"Erro ao gerar briefing: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
