#!/usr/bin/env python3
"""Render a portable solo-dev-assistant session briefing.

The script is read-only. It derives every section from ROADMAP.md plus local
git/gh state so repeated runs over the same inputs are stable.
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


PHASE_RE = re.compile(
    r"^##\s+(?:(?:Fase|Phase)\s+)?(?:(?P<number>\d+)\s*(?:[—-]\s*)?)?(?P<title>.+?)\s*$",
    re.IGNORECASE,
)
TASK_RE = re.compile(r"^(?P<indent>\s*)-\s+\[(?P<box>[ xX])\]\s+(?P<body>.+?)\s*$")
OWNER_RE = re.compile(r"`@(?P<owner>[a-zA-Z][\w-]*)`")
WAITING_RE = re.compile(r"\((?:aguardando|waiting):\s*(?P<reason>[^)]+)\)", re.IGNORECASE)
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
    "for",
    "in",
    "na",
    "no",
    "o",
    "of",
    "os",
    "para",
    "por",
    "the",
    "to",
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


def roadmap_file(root: Path) -> Path | None:
    for candidate in [root / "docs/ROADMAP.md", root / "ROADMAP.md"]:
        if candidate.exists():
            return candidate
    return None


def read_text(path: Path | None) -> str:
    if path is None or not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def project_name(root: Path) -> str:
    package_json = root / "package.json"
    if package_json.exists():
        try:
            data = json.loads(package_json.read_text(encoding="utf-8"))
            name = str(data.get("name") or "").strip()
            if name:
                return name
        except json.JSONDecodeError:
            pass

    pyproject = root / "pyproject.toml"
    if pyproject.exists():
        match = re.search(r"(?m)^name\s*=\s*[\"']([^\"']+)[\"']", pyproject.read_text(encoding="utf-8"))
        if match:
            return match.group(1).strip()

    readme = root / "README.md"
    if readme.exists():
        for line in readme.read_text(encoding="utf-8").splitlines():
            if line.startswith("# "):
                return line[2:].strip()

    return root.name


def detect_locale(*texts: str) -> str:
    raw = "\n".join(texts)
    normalized = normalize_to_ascii(raw)
    pt_score = len(re.findall(r"\b(fase|aguardando|visao|publico|glossario|invariante|projeto)\b", normalized))
    en_score = len(re.findall(r"\b(phase|waiting|vision|audience|glossary|invariant|project)\b", normalized))
    if re.search(r"[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]", raw):
        pt_score += 3
    if en_score > pt_score:
        return "en"
    return "pt"


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

    if not headings:
        return [Phase(number="?", title="Roadmap", tasks=parse_tasks(lines, start_line=1))]

    phases: list[Phase] = []
    for heading_index, (line_index, match) in enumerate(headings):
        next_index = headings[heading_index + 1][0] if heading_index + 1 < len(headings) else len(lines)
        section_lines = lines[line_index + 1 : next_index]
        tasks = parse_tasks(section_lines, start_line=line_index + 2)
        number = match.group("number") or "?"
        phases.append(Phase(number=number, title=match.group("title"), tasks=tasks))
    return phases


def active_phase(phases: list[Phase]) -> Phase:
    for phase in phases:
        if any(not task.done for task in phase.tasks):
            return phase
    for phase in phases:
        if phase.tasks:
            return phase
    return Phase(number="?", title="Roadmap", tasks=[])


def phase_label(phase: Phase, locale: str) -> str:
    if phase.number != "?":
        label = "Phase" if locale == "en" else "Fase"
        return f"{label} {phase.number} — {phase.title}"
    return phase.title


def normalize_to_ascii(text: str) -> str:
    return (
        unicodedata.normalize("NFKD", text)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )


def normalize(text: str) -> list[str]:
    ascii_text = normalize_to_ascii(text)
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


def pr_label(pr: dict[str, str], locale: str) -> str:
    number = pr.get("number")
    title = pr.get("title", "untitled" if locale == "en" else "sem titulo")
    url = pr.get("url", "")
    head = pr.get("headRefName", "")
    state = "draft" if pr.get("isDraft") else ("open" if locale == "en" else "aberto")
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


def reference_for_task(
    task: Task,
    prs: list[dict[str, str]],
    branches: list[str],
    current: str,
    locale: str,
) -> tuple[str, int | None]:
    pr = best_pr_for_task(task, prs)
    branch = best_branch_for_task(task, branches, current)
    pieces: list[str] = []
    matched_pr_number: int | None = None
    if pr:
        matched_pr_number = int(pr.get("number", 0))
        pieces.append(pr_label(pr, locale))
    if branch and (not pr or branch != pr.get("headRefName")):
        pieces.append(f"branch `{branch}`")
    fallback = "no branch/PR detected" if locale == "en" else "sem branch/PR detectado"
    return ("; ".join(pieces) if pieces else fallback), matched_pr_number


def recent_roadmap_commits(root: Path, path: Path) -> list[str]:
    try:
        relative = str(path.relative_to(root))
    except ValueError:
        relative = str(path)
    output = run(
        [
            "git",
            "log",
            "--since=7 days ago",
            "--format=%s",
            "--",
            relative,
        ],
        root,
    )
    commits = []
    for line in output.splitlines():
        subject = re.sub(r"^chore\(roadmap\):\s*", "", line).strip()
        if subject and subject not in commits:
            commits.append(subject)
    return commits


def load_skill_map() -> list[tuple[str, list[str]]]:
    path = Path(__file__).resolve().parents[1] / "skills-map.md"
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


def suggested_skills(tasks: list[Task], skill_map: list[tuple[str, list[str]]], locale: str) -> list[str]:
    suggestions: list[str] = []
    seen: set[tuple[str, str]] = set()
    for task in tasks:
        normalized_title = " ".join(normalize(task.title))
        for skill, patterns in skill_map:
            if any(" ".join(normalize(pattern)) in normalized_title for pattern in patterns):
                key = (task.title, skill)
                if key not in seen:
                    if locale == "en":
                        suggestions.append(f'- For "{task.title}": `{skill}`')
                    else:
                        suggestions.append(f'- Para "{task.title}": `{skill}`')
                    seen.add(key)
                break
    return suggestions


def available_line(index: int, task: Task, locale: str) -> str:
    owner = f" `@{task.owner}`" if task.owner else ""
    context = ""
    if task.child_unfinished_count:
        if locale == "en":
            label = "subtask" if task.child_unfinished_count == 1 else "subtasks"
            context = f" — unlocks {task.child_unfinished_count} {label}"
        else:
            label = "subtarefa" if task.child_unfinished_count == 1 else "subtarefas"
            context = f" — destrava {task.child_unfinished_count} {label}"
    return f"{index}. {task.title}{owner}{context}"


def render() -> str:
    root = repo_root()
    path = roadmap_file(root)
    if path is None:
        raise FileNotFoundError("docs/ROADMAP.md ou ROADMAP.md nao encontrado")

    roadmap = path.read_text(encoding="utf-8")
    locale = detect_locale(roadmap, read_text(root / "README.md"))
    phases = parse_phases(roadmap)
    phase = active_phase(phases)
    prs = open_prs(root)
    branches = local_feature_branches(root)
    current = current_branch(root)

    in_flight = [task for task in phase.tasks if task.in_progress and not task.blocked]
    blocked = [task for task in phase.tasks if task.blocked]
    available = [task for task in phase.tasks if task.available and task.child_unfinished_count == 0]

    if locale == "en":
        labels = {
            "empty": "none",
            "in_flight": "### In flight",
            "blocked": "### Blocked / waiting",
            "available": "### Available next (top 5)",
            "skills": "### Suggested skills",
            "recent": "### Recently completed (last 7 days)",
            "more": "more in ROADMAP",
            "review_required": "waiting for review",
            "changes_requested": "changes requested",
        }
        title = f"## Briefing — {project_name(root)} @ {phase_label(phase, locale)}"
    else:
        labels = {
            "empty": "nada",
            "in_flight": "### Em voo",
            "blocked": "### Bloqueado / aguardando",
            "available": "### Disponível para pegar (top 5)",
            "skills": "### Skills sugeridas",
            "recent": "### Recém-concluído (últimos 7 dias)",
            "more": "mais no ROADMAP",
            "review_required": "aguardando revisão",
            "changes_requested": "mudanças solicitadas",
        }
        title = f"## Briefing — {project_name(root)} @ {phase_label(phase, locale)}"

    lines: list[str] = [title, ""]

    lines.extend([labels["in_flight"]])
    matched_prs: set[int] = set()
    if in_flight:
        for task in in_flight:
            reference, matched_pr = reference_for_task(task, prs, branches, current, locale)
            if matched_pr:
                matched_prs.add(matched_pr)
            lines.append(f"- {task.title} 🚧 — {reference}")
    for pr in prs:
        number = int(pr.get("number", 0))
        if number in matched_prs or review_waiting(pr):
            continue
        lines.append(f"- {pr_label(pr, locale)}")
    if lines[-1] == labels["in_flight"]:
        lines.append(labels["empty"])
    lines.append("")

    lines.extend([labels["blocked"]])
    if blocked:
        for task in blocked:
            waiting_key = "waiting" if locale == "en" else "aguardando"
            lines.append(f"- {task.title} 🚧 ({waiting_key}: {task.waiting_reason})")
    for pr in prs:
        if not review_waiting(pr):
            continue
        review_state = labels["changes_requested"] if pr.get("reviewDecision") == "CHANGES_REQUESTED" else labels["review_required"]
        lines.append(f"- {pr_label(pr, locale)} — {review_state}")
    if lines[-1] == labels["blocked"]:
        lines.append(labels["empty"])
    lines.append("")

    lines.extend([labels["available"]])
    if available:
        for index, task in enumerate(available[:5], start=1):
            lines.append(available_line(index, task, locale))
        remaining = len(available) - 5
        if remaining > 0:
            lines.append(f"(+{remaining} {labels['more']})")
    else:
        lines.append(labels["empty"])
    lines.append("")

    lines.extend([labels["skills"]])
    suggestions = suggested_skills(in_flight + blocked, load_skill_map(), locale)
    lines.extend(suggestions if suggestions else [labels["empty"]])
    lines.append("")

    lines.extend([labels["recent"]])
    recent = recent_roadmap_commits(root, path)
    lines.extend([f"- {item}" for item in recent] if recent else [labels["empty"]])

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
