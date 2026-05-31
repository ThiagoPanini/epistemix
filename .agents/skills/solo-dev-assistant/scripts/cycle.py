#!/usr/bin/env python3
"""Diagnose the next solo-dev-assistant process movement."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from briefing import (
    active_phase,
    current_branch,
    detect_locale,
    local_feature_branches,
    open_prs,
    parse_phases,
    project_name,
    read_text,
    repo_root,
    roadmap_file,
    run,
)


MAIN_BRANCHES = {"main", "master", "trunk"}


def has_todo(text: str) -> bool:
    return bool(re.search(r"\b(TODO|TBD|a definir|em aberto|open question|open questions)\b", text, re.IGNORECASE))


def is_seed(text: str) -> bool:
    return bool(re.search(r"(seed provis|provisional seed|solo-dev-assistant start)", text, re.IGNORECASE))


def find_existing(root: Path, patterns: list[str]) -> list[Path]:
    found: list[Path] = []
    for pattern in patterns:
        found.extend(path for path in root.glob(pattern) if path.is_file())
    return sorted(set(found))


def relative_list(root: Path, paths: list[Path], limit: int = 3) -> str:
    labels = []
    for path in paths[:limit]:
        try:
            labels.append(str(path.relative_to(root)))
        except ValueError:
            labels.append(str(path))
    extra = len(paths) - limit
    if extra > 0:
        labels.append(f"+{extra}")
    return ", ".join(labels)


def foundation_state(root: Path) -> dict[str, Path | None]:
    roadmap = roadmap_file(root)
    context_docs = [root / "docs/CONTEXT.md", root / "CONTEXT.md"]
    context = next((path for path in context_docs if path.exists()), None)
    return {
        "README.md": root / "README.md" if (root / "README.md").exists() else None,
        "AGENTS.md": root / "AGENTS.md" if (root / "AGENTS.md").exists() else None,
        "docs/VISION.md": root / "docs/VISION.md" if (root / "docs/VISION.md").exists() else None,
        "ROADMAP.md": roadmap,
        "CONTEXT.md": context,
    }


def phase_prompt(phase: str, locale: str) -> tuple[str, str, str]:
    if locale == "en":
        prompts = {
            "Start": (
                "/solo-dev-assistant start",
                "Create seed project docs before planning implementation.",
                "Run `/solo-dev-assistant start` and answer the intake questions for this project.",
            ),
            "Grill": (
                "/grill-me or /grill-with-docs",
                "Resolve scope, domain language, and decisions before creating specs or implementation tasks.",
                "Use grill-me to refine this project using `docs/VISION.md`, `docs/ROADMAP.md`, and `docs/CONTEXT.md`. Ask one question at a time and recommend answers.",
            ),
            "Research": (
                "research spike",
                "Investigate the unknown before committing to architecture or implementation.",
                "Run a research spike for the open technical questions in this project. Summarize options, risks, and a recommendation.",
            ),
            "Prototype": (
                "/prototype",
                "Build throwaway code to answer the question that cannot be settled on paper.",
                "Use prototype to answer the unresolved product or technical question with the smallest useful throwaway demo.",
            ),
            "PRD": (
                "/to-prd or write-milestone-brief",
                "Turn resolved context into a spec or milestone brief before decomposition.",
                "Turn the resolved context in `docs/VISION.md`, `docs/CONTEXT.md`, and the current conversation into a lightweight PRD.",
            ),
            "Issues": (
                "/to-issues or decompose-into-slices",
                "Break the spec into thin vertical slices that an agent can implement and verify.",
                "Break the current PRD/spec into small vertical slices, marking dependencies and human checkpoints.",
            ),
            "Implement": (
                "/tdd",
                "Implement the active executable slice with behavior-first verification.",
                "Implement the active roadmap item using TDD: one observable behavior at a time, through public interfaces.",
            ),
            "Review": (
                "/review and /verify-before-complete",
                "Review the current diff or PR before claiming completion.",
                "Review the current diff against the project docs and original intent. Prioritize bugs, regressions, security, and missing tests.",
            ),
            "Uncertain": (
                "/solo-dev-assistant briefing",
                "Collect a deterministic session briefing before choosing a heavier workflow.",
                "Run `/solo-dev-assistant briefing` and use the output to decide whether this is planning, implementation, or review.",
            ),
        }
    else:
        prompts = {
            "Start": (
                "/solo-dev-assistant start",
                "Criar os docs seed do projeto antes de planejar implementação.",
                "Rode `/solo-dev-assistant start` e responda o intake deste projeto.",
            ),
            "Grill": (
                "/grill-me ou /grill-with-docs",
                "Resolver escopo, linguagem de domínio e decisões antes de criar specs ou tarefas.",
                "Use grill-me para refinar este projeto com base em `docs/VISION.md`, `docs/ROADMAP.md` e `docs/CONTEXT.md`. Faça uma pergunta por vez e recomende respostas.",
            ),
            "Research": (
                "research spike",
                "Investigar o desconhecido antes de comprometer arquitetura ou implementação.",
                "Faça um research spike para as perguntas técnicas abertas deste projeto. Resuma opções, riscos e uma recomendação.",
            ),
            "Prototype": (
                "/prototype",
                "Criar código descartável para responder a pergunta que não dá para resolver só no papel.",
                "Use prototype para responder a pergunta de produto ou técnica pendente com o menor demo descartável útil.",
            ),
            "PRD": (
                "/to-prd ou write-milestone-brief",
                "Transformar contexto resolvido em spec ou milestone brief antes da decomposição.",
                "Transforme o contexto resolvido em `docs/VISION.md`, `docs/CONTEXT.md` e na conversa atual em um PRD leve.",
            ),
            "Issues": (
                "/to-issues ou decompose-into-slices",
                "Quebrar a spec em slices verticais finos que um agente consiga implementar e verificar.",
                "Quebre o PRD/spec atual em slices verticais pequenos, marcando dependências e checkpoints humanos.",
            ),
            "Implement": (
                "/tdd",
                "Implementar o slice executável ativo com verificação behavior-first.",
                "Implemente o item ativo do roadmap usando TDD: um comportamento observável por vez, via interfaces públicas.",
            ),
            "Review": (
                "/review e /verify-before-complete",
                "Revisar o diff ou PR atual antes de declarar conclusão.",
                "Revise o diff atual contra os docs do projeto e a intenção original. Priorize bugs, regressões, segurança e testes faltantes.",
            ),
            "Uncertain": (
                "/solo-dev-assistant briefing",
                "Coletar um briefing determinístico da sessão antes de escolher um workflow mais pesado.",
                "Rode `/solo-dev-assistant briefing` e use a saída para decidir se isto é planejamento, implementação ou review.",
            ),
        }
    return prompts[phase]


def diagnose(root: Path) -> tuple[str, str, list[str], str]:
    files = foundation_state(root)
    existing = {name: path for name, path in files.items() if path is not None}
    missing = [name for name, path in files.items() if path is None]

    roadmap_path = files["ROADMAP.md"]
    roadmap_text = read_text(roadmap_path)
    context_text = read_text(files["CONTEXT.md"])
    vision_text = read_text(files["docs/VISION.md"])
    locale = detect_locale(roadmap_text, context_text, vision_text, read_text(files["README.md"]))

    specs = find_existing(
        root,
        [
            "PRD.md",
            "docs/PRD.md",
            "docs/prd/*.md",
            "docs/specs/**/*.md",
            "specs/**/*.md",
            "M*-CONTEXT.md",
        ],
    )
    slices = find_existing(
        root,
        [
            "M*-ROADMAP.md",
            "docs/issues/*.md",
            "docs/slices/*.md",
            ".github/issues/*.md",
            "issues/*.md",
        ],
    )

    dirty = [line for line in run(["git", "status", "--short"], root).splitlines() if line.strip()]
    prs = open_prs(root)
    branch = current_branch(root)
    feature_branches = local_feature_branches(root)
    phases = parse_phases(roadmap_text) if roadmap_text else []
    active = active_phase(phases) if phases else None
    in_flight = [task for task in (active.tasks if active else []) if task.in_progress and not task.blocked]

    evidence: list[str] = []

    if len(existing) <= 2 or roadmap_path is None:
        if locale == "en":
            evidence.append(f"{len(missing)} foundational docs are missing: {', '.join(missing)}")
        else:
            evidence.append(f"{len(missing)} docs fundacionais ausentes: {', '.join(missing)}")
        return "Start", "high", evidence, locale

    if prs:
        if locale == "en":
            evidence.append(f"{len(prs)} open PR(s) detected through gh")
        else:
            evidence.append(f"{len(prs)} PR(s) aberto(s) detectado(s) via gh")
        return "Review", "high", evidence, locale

    if dirty:
        if locale == "en":
            evidence.append(f"{len(dirty)} local git change(s) detected")
        else:
            evidence.append(f"{len(dirty)} mudança(s) local(is) detectada(s) no git")
        return "Review", "high", evidence, locale

    if branch and branch not in MAIN_BRANCHES and branch in feature_branches:
        if locale == "en":
            evidence.append(f"current feature branch detected: `{branch}`")
        else:
            evidence.append(f"branch de trabalho atual detectada: `{branch}`")
        return "Review", "medium", evidence, locale

    if in_flight:
        if locale == "en":
            evidence.append(f"{len(in_flight)} roadmap item(s) marked in progress with 🚧")
        else:
            evidence.append(f"{len(in_flight)} item(ns) do roadmap marcado(s) em andamento com 🚧")
        return "Implement", "high", evidence, locale

    if specs and not slices:
        if locale == "en":
            evidence.append(f"spec/PRD artifact detected: {relative_list(root, specs)}")
            evidence.append("no local slice/issue artifact detected")
        else:
            evidence.append(f"artefato de spec/PRD detectado: {relative_list(root, specs)}")
            evidence.append("nenhum artefato local de slice/issue detectado")
        return "Issues", "high", evidence, locale

    combined = "\n".join([roadmap_text, context_text, vision_text])
    if re.search(r"\b(prototype|prototipo|protótipo|throwaway|demo descartavel|demo descartável)\b", combined, re.IGNORECASE):
        if locale == "en":
            evidence.append("prototype-oriented language detected in docs")
        else:
            evidence.append("linguagem orientada a protótipo detectada nos docs")
        return "Prototype", "medium", evidence, locale

    if re.search(r"\b(research|pesquisa|spike|investigar|unknown|desconhecido|external api|api externa)\b", combined, re.IGNORECASE):
        if locale == "en":
            evidence.append("research/spike or unknown-risk language detected in docs")
        else:
            evidence.append("linguagem de pesquisa/spike ou risco desconhecido detectada nos docs")
        return "Research", "medium", evidence, locale

    if has_todo(context_text) or not context_text.strip():
        if locale == "en":
            evidence.append("domain context is missing or still contains TODO/open questions")
        else:
            evidence.append("contexto de domínio ausente ou ainda com TODO/perguntas em aberto")
        return "Grill", "medium", evidence, locale

    if is_seed(roadmap_text) or has_todo(roadmap_text) or has_todo(vision_text):
        if locale == "en":
            evidence.append("seed roadmap or unresolved TODOs detected")
        else:
            evidence.append("roadmap seed ou TODOs não resolvidos detectados")
        return "Grill", "medium", evidence, locale

    if not specs:
        if locale == "en":
            evidence.append("foundation docs exist and no PRD/spec artifact was found")
        else:
            evidence.append("docs fundacionais existem e nenhum artefato de PRD/spec foi encontrado")
        return "PRD", "medium", evidence, locale

    if locale == "en":
        evidence.append("no strong phase evidence found")
    else:
        evidence.append("nenhuma evidência forte de fase encontrada")
    return "Uncertain", "low", evidence, locale


def optional_edit(phase: str, locale: str) -> str:
    if locale == "en":
        edits = {
            "Start": "none; run `/solo-dev-assistant start` first.",
            "Grill": "optionally mark the roadmap refinement item as `🚧` after confirmation.",
            "Research": "optionally add a small research-spike task to the roadmap after confirmation.",
            "Prototype": "optionally add a throwaway prototype task to the roadmap after confirmation.",
            "PRD": "optionally add a PRD/spec task to the roadmap after confirmation.",
            "Issues": "optionally add a vertical-slice decomposition task to the roadmap after confirmation.",
            "Implement": "optionally mark the active executable slice as `🚧` after confirmation.",
            "Review": "none; review the current diff/PR before changing roadmap state.",
            "Uncertain": "none; get a briefing first.",
        }
    else:
        edits = {
            "Start": "nenhuma; rode `/solo-dev-assistant start` primeiro.",
            "Grill": "opcionalmente marcar o item de refinamento do roadmap como `🚧` após confirmação.",
            "Research": "opcionalmente adicionar uma tarefa pequena de research spike ao roadmap após confirmação.",
            "Prototype": "opcionalmente adicionar uma tarefa de protótipo descartável ao roadmap após confirmação.",
            "PRD": "opcionalmente adicionar uma tarefa de PRD/spec ao roadmap após confirmação.",
            "Issues": "opcionalmente adicionar uma tarefa de decomposição em slices verticais ao roadmap após confirmação.",
            "Implement": "opcionalmente marcar o slice executável ativo como `🚧` após confirmação.",
            "Review": "nenhuma; revise o diff/PR atual antes de mudar estado do roadmap.",
            "Uncertain": "nenhuma; gere um briefing primeiro.",
        }
    return edits[phase]


def render() -> str:
    root = repo_root()
    phase, confidence, evidence, locale = diagnose(root)
    skill, movement, prompt = phase_prompt(phase, locale)
    project = project_name(root)

    if locale == "en":
        confidence_label = {"high": "high", "medium": "medium", "low": "low"}[confidence]
        lines = [
            f"## Cycle — {project}",
            "",
            "### Likely phase",
            f"{phase} — confidence: {confidence_label}",
            "",
            "### Evidence",
        ]
        lines.extend([f"- {item}" for item in evidence] or ["- no strong evidence found"])
        lines.extend(
            [
                "",
                "### Next movement",
                movement,
                "",
                "### Recommended skill or workflow",
                skill,
                "",
                "### Suggested prompt",
                f"> {prompt}",
                "",
                "### Optional roadmap edit",
                optional_edit(phase, locale),
            ]
        )
        return "\n".join(lines)

    confidence_label = {"high": "alta", "medium": "média", "low": "baixa"}[confidence]
    phase_label = "Indefinida" if phase == "Uncertain" else phase
    lines = [
        f"## Cycle — {project}",
        "",
        "### Fase provável",
        f"{phase_label} — confiança: {confidence_label}",
        "",
        "### Evidências",
    ]
    lines.extend([f"- {item}" for item in evidence] or ["- nenhuma evidência forte encontrada"])
    lines.extend(
        [
            "",
            "### Próximo movimento",
            movement,
            "",
            "### Skill ou workflow recomendado",
            skill,
            "",
            "### Prompt sugerido",
            f"> {prompt}",
            "",
            "### Edição opcional de roadmap",
            optional_edit(phase, locale),
        ]
    )
    return "\n".join(lines)


def main() -> int:
    try:
        print(render())
    except Exception as exc:  # noqa: BLE001 - operator-facing smoke command
        print(f"Erro ao gerar cycle: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
