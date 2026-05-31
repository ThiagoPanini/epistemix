#!/usr/bin/env python3
"""Generate seed docs for `/solo-dev-assistant start`.

The command is intentionally modest: collect a few project facts, render five
markdown templates, and leave deeper decisions to downstream skills.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from string import Template


DOCS = ["README.md", "VISION.md", "ROADMAP.md", "AGENTS.md", "CONTEXT.md"]
GENERIC_WORDS = {
    "app",
    "aplicacao",
    "aplicativo",
    "clientes",
    "coisas",
    "developers",
    "desenvolvedores",
    "funcionando",
    "plataforma",
    "pronto",
    "sistema",
    "software",
    "usuarios",
    "users",
}


@dataclass
class Answers:
    project_name: str
    problem: str
    audience: str
    v1_success: str
    anti_scope: str = ""
    stack: str = ""
    non_functionals: str = ""


def normalize(text: str) -> str:
    return (
        unicodedata.normalize("NFKD", text)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )


def words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", normalize(text))


def is_shallow(text: str) -> bool:
    tokens = words(text)
    if len(tokens) < 5:
        return True
    meaningful = [token for token in tokens if token not in GENERIC_WORDS]
    return len(meaningful) < 3


def ask(prompt: str) -> str:
    return input(f"{prompt}\n> ").strip()


def merge_answer(base: str, extra: str) -> str:
    if not extra:
        return base
    if not base:
        return extra
    return f"{base} — {extra}"


def collect_interactively(seed: Answers) -> Answers:
    if seed.problem and seed.audience and seed.v1_success:
        return seed

    if not sys.stdin.isatty():
        return seed

    print("Rodada 1 — respostas obrigatórias")
    if not seed.project_name:
        seed.project_name = ask("Qual é o nome do projeto?")
    if not seed.problem:
        seed.problem = ask("Em uma frase, que problema esse projeto resolve?")
    if not seed.audience:
        seed.audience = ask("Para quem?")
    if not seed.v1_success:
        seed.v1_success = ask("Como saber que V1 deu certo?")

    weak_fields = []
    if is_shallow(seed.problem):
        weak_fields.append("problem")
    if is_shallow(seed.audience):
        weak_fields.append("audience")
    if is_shallow(seed.v1_success):
        weak_fields.append("v1_success")

    if weak_fields:
        print("\nRodada 2 — fechando a parte mais rasa")
    for field in weak_fields[:2]:
        if field == "problem":
            extra = ask("Que dor concreta aparece hoje, em qual contexto, e qual objeto/processo está envolvido?")
            seed.problem = merge_answer(seed.problem, extra)
        elif field == "audience":
            extra = ask("Que tipo de usuário exatamente? Inclua função, contexto de uso ou segmento.")
            seed.audience = merge_answer(seed.audience, extra)
        elif field == "v1_success":
            extra = ask("Em concreto: quais fluxos, números, usuários ativos, ou ambiente validável provam que V1 deu certo?")
            seed.v1_success = merge_answer(seed.v1_success, extra)

    round3 = []
    if not seed.anti_scope:
        round3.append("anti_scope")
    if not seed.stack:
        round3.append("stack")

    if round3:
        print("\nRodada 3 — slots opcionais")
    for field in round3[:2]:
        if field == "anti_scope":
            seed.anti_scope = ask("O que esse projeto explicitamente NÃO é?")
        elif field == "stack":
            seed.stack = ask("Stack já decidida? Se sim, qual; se não, deixe vazio ou responda 'não decidida'.")

    return seed


def todo(text: str, downstream: str = "/grill-me") -> str:
    return f"_TODO: {text} via `{downstream}`._"


def clean_optional(value: str, todo_text: str, downstream: str = "/grill-me") -> str:
    value = value.strip()
    if not value or normalize(value) in {"nao", "nao decidida", "indefinida", "indefinido", "todo"}:
        return todo(todo_text, downstream)
    return value


def template_values(answers: Answers) -> dict[str, str]:
    project_name = clean_optional(answers.project_name, "definir nome do projeto").strip("._")
    problem = clean_optional(answers.problem, "descrever problema em uma frase")
    audience = clean_optional(answers.audience, "descrever publico-alvo")
    v1_success = clean_optional(answers.v1_success, "definir criterio concreto de sucesso da V1")
    anti_scope = clean_optional(answers.anti_scope, "explicitar anti-escopo")
    stack = clean_optional(answers.stack, "decidir stack e registrar ADR-0001")
    non_functionals = clean_optional(
        answers.non_functionals,
        "levantar atributos nao-funcionais se forem relevantes",
    )

    return {
        "PROJECT_NAME": project_name,
        "PROBLEM": problem,
        "AUDIENCE": audience,
        "V1_SUCCESS": v1_success,
        "ANTI_SCOPE": anti_scope,
        "STACK": stack,
        "NON_FUNCTIONALS": non_functionals,
        "ONE_LINE": f"{project_name}: {problem}",
    }


def render_template(raw: str, values: dict[str, str]) -> str:
    escaped = raw.replace("$", "$$")
    for key in values:
        escaped = escaped.replace("{{" + key + "}}", "${" + key + "}")
    return Template(escaped).safe_substitute(values)


def load_answers(args: argparse.Namespace) -> Answers:
    data: dict[str, str] = {}
    if args.answers_json:
        data.update(json.loads(Path(args.answers_json).read_text(encoding="utf-8")))

    for key in [
        "project_name",
        "problem",
        "audience",
        "v1_success",
        "anti_scope",
        "stack",
        "non_functionals",
    ]:
        value = getattr(args, key)
        if value is not None:
            data[key] = value

    target_name = Path(args.target).resolve().name
    return Answers(
        project_name=str(data.get("project_name") or target_name),
        problem=str(data.get("problem") or ""),
        audience=str(data.get("audience") or ""),
        v1_success=str(data.get("v1_success") or ""),
        anti_scope=str(data.get("anti_scope") or ""),
        stack=str(data.get("stack") or ""),
        non_functionals=str(data.get("non_functionals") or ""),
    )


def write_docs(target: Path, answers: Answers, force: bool) -> list[Path]:
    skill_dir = Path(__file__).resolve().parents[1]
    template_dir = skill_dir / "templates"
    docs_dir = target / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)

    destinations = [docs_dir / doc for doc in DOCS]
    existing = [path for path in destinations if path.exists()]
    if existing and not force:
        existing_list = ", ".join(str(path.relative_to(target)) for path in existing)
        raise RuntimeError(f"arquivos ja existem: {existing_list}; confirme e rode com --force")

    values = template_values(answers)
    written: list[Path] = []
    for doc in DOCS:
        template_path = template_dir / f"{doc}.tmpl"
        rendered = render_template(template_path.read_text(encoding="utf-8"), values).rstrip() + "\n"
        destination = docs_dir / doc
        destination.write_text(rendered, encoding="utf-8")
        written.append(destination)
    return written


def print_handoff(target: Path, written: list[Path]) -> None:
    relative_docs = "./docs"
    if target != Path.cwd().resolve():
        relative_docs = str((target / "docs").resolve())

    print(f"✓ 5 documentos gerados em {relative_docs}/:")
    for path in written:
        suffix = " (esqueleto)" if path.name == "CONTEXT.md" else ""
        print(f"  - {path.name}{suffix}")
    print()
    print("Próximos passos sugeridos:")
    print("  1. Refinar VISION/ROADMAP com mais profundidade → /grill-me")
    print("  2. Preencher CONTEXT.md (glossário, invariantes) → /grill-with-docs")
    print("  3. Quando começar a executar → /solo-dev-assistant briefing")
    print("  4. Iniciar repositório git e ADR-0001 com decisões fundacionais")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate seed docs for solo-dev-assistant start")
    parser.add_argument("--target", default=".", help="target project root")
    parser.add_argument("--answers-json", help="JSON file with collected answers")
    parser.add_argument("--project-name")
    parser.add_argument("--problem")
    parser.add_argument("--audience")
    parser.add_argument("--v1-success", dest="v1_success")
    parser.add_argument("--anti-scope", dest="anti_scope")
    parser.add_argument("--stack")
    parser.add_argument("--non-functionals", dest="non_functionals")
    parser.add_argument("--force", action="store_true", help="overwrite existing generated docs")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    target = Path(args.target).resolve()
    target.mkdir(parents=True, exist_ok=True)

    try:
        answers = collect_interactively(load_answers(args))
        written = write_docs(target, answers, force=args.force)
    except Exception as exc:  # noqa: BLE001 - command-line operator feedback
        print(f"Erro ao executar start: {exc}", file=sys.stderr)
        return 1

    print_handoff(target, written)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
