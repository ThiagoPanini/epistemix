#!/usr/bin/env python3
"""Generate seed docs for `/solo-dev-assistant start`.

The command is intentionally modest: collect a few project facts, render five
markdown files, and leave deeper decisions to downstream skills.
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


DOCS = [
    ("README.md", Path("README.md"), "README_DOC"),
    ("AGENTS.md", Path("AGENTS.md"), "AGENTS_DOC"),
    ("VISION.md", Path("docs/VISION.md"), "VISION_DOC"),
    ("ROADMAP.md", Path("docs/ROADMAP.md"), "ROADMAP_DOC"),
    ("CONTEXT.md", Path("docs/CONTEXT.md"), "CONTEXT_DOC"),
]

GENERIC_WORDS = {
    "app",
    "aplicacao",
    "aplicativo",
    "clientes",
    "coisas",
    "developers",
    "desenvolvedores",
    "funcionando",
    "platform",
    "plataforma",
    "pronto",
    "ready",
    "software",
    "system",
    "sistema",
    "users",
    "usuarios",
    "working",
}

PT_MARKERS = {
    "a",
    "alvo",
    "como",
    "com",
    "de",
    "do",
    "em",
    "para",
    "problema",
    "projeto",
    "publico",
    "que",
    "resolve",
    "sucesso",
    "usuarios",
}

EN_MARKERS = {
    "a",
    "audience",
    "for",
    "project",
    "problem",
    "solves",
    "success",
    "the",
    "this",
    "users",
    "v1",
    "what",
    "who",
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
    language: str = ""


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


def detect_language(answers: Answers) -> str:
    explicit = normalize(answers.language.strip())
    if explicit.startswith("pt") or explicit in {"portugues", "portuguese"}:
        return "pt"
    if explicit.startswith("en") or explicit in {"english", "ingles"}:
        return "en"

    raw = " ".join(
        [
            answers.project_name,
            answers.problem,
            answers.audience,
            answers.v1_success,
            answers.anti_scope,
            answers.stack,
            answers.non_functionals,
        ]
    )
    tokens = words(raw)
    pt_score = sum(token in PT_MARKERS for token in tokens)
    en_score = sum(token in EN_MARKERS for token in tokens)
    if re.search(r"[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]", raw):
        pt_score += 3
    if en_score > pt_score and en_score >= 2:
        return "en"
    return "pt"


def ask(prompt: str) -> str:
    return input(f"{prompt}\n> ").strip()


def merge_answer(base: str, extra: str) -> str:
    if not extra:
        return base
    if not base:
        return extra
    return f"{base} — {extra}"


def collect_interactively(seed: Answers) -> Answers:
    locale = detect_language(seed)
    if seed.problem and seed.audience and seed.v1_success:
        return seed

    if not sys.stdin.isatty():
        return seed

    if locale == "en":
        print("Round 1 — required answers")
        if not seed.project_name:
            seed.project_name = ask("What is the project name?")
        if not seed.problem:
            seed.problem = ask("In one sentence, what problem does this project solve?")
        if not seed.audience:
            seed.audience = ask("Who is it for?")
        if not seed.v1_success:
            seed.v1_success = ask("How will we know V1 succeeded?")
    else:
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
        print("\nRound 2 — tightening the shallowest answer" if locale == "en" else "\nRodada 2 — fechando a parte mais rasa")
    for field in weak_fields[:2]:
        if locale == "en":
            prompts = {
                "problem": "What concrete pain shows up today, in what context, and around which object or process?",
                "audience": "Which exact kind of user? Include role, use context, or segment.",
                "v1_success": "Concretely: which flows, numbers, active users, or validated environment prove that V1 succeeded?",
            }
        else:
            prompts = {
                "problem": "Que dor concreta aparece hoje, em qual contexto, e qual objeto/processo está envolvido?",
                "audience": "Que tipo de usuário exatamente? Inclua função, contexto de uso ou segmento.",
                "v1_success": "Em concreto: quais fluxos, números, usuários ativos, ou ambiente validável provam que V1 deu certo?",
            }
        extra = ask(prompts[field])
        if field == "problem":
            seed.problem = merge_answer(seed.problem, extra)
        elif field == "audience":
            seed.audience = merge_answer(seed.audience, extra)
        elif field == "v1_success":
            seed.v1_success = merge_answer(seed.v1_success, extra)

    round3 = []
    if not seed.anti_scope:
        round3.append("anti_scope")
    if not seed.stack:
        round3.append("stack")

    if round3:
        print("\nRound 3 — optional slots" if locale == "en" else "\nRodada 3 — slots opcionais")
    for field in round3[:2]:
        if locale == "en":
            if field == "anti_scope":
                seed.anti_scope = ask("What is this project explicitly NOT?")
            elif field == "stack":
                seed.stack = ask("Is the stack already decided? If yes, what is it; if not, leave blank or say 'not decided'.")
        else:
            if field == "anti_scope":
                seed.anti_scope = ask("O que esse projeto explicitamente NÃO é?")
            elif field == "stack":
                seed.stack = ask("Stack já decidida? Se sim, qual; se não, deixe vazio ou responda 'não decidida'.")

    return seed


def todo(text: str, downstream: str = "/grill-me") -> str:
    return f"_TODO: {text} via `{downstream}`._"


def clean_optional(value: str, todo_text: str, downstream: str = "/grill-me") -> str:
    value = value.strip()
    normalized = normalize(value)
    if not value or normalized in {
        "nao",
        "nao decidida",
        "not decided",
        "indefinida",
        "indefinido",
        "undefined",
        "todo",
        "tbd",
    }:
        return todo(todo_text, downstream)
    return value


def clean_project_name(value: str, target: Path) -> str:
    name = value.strip() or target.resolve().name
    return re.sub(r"\s+", " ", name).strip() or target.resolve().name


def pt_docs(values: dict[str, str]) -> dict[str, str]:
    project = values["PROJECT_NAME"]
    return {
        "README_DOC": f"""# {project}

{values["ONE_LINE"]}

![CI](https://img.shields.io/badge/ci-TODO-lightgrey)
![License](https://img.shields.io/badge/license-TODO-lightgrey)

## Documentos

- [Visão](docs/VISION.md)
- [Roadmap](docs/ROADMAP.md)
- [Contexto de domínio](docs/CONTEXT.md)
- [Instruções para agentes](AGENTS.md)

## Estado

Projeto em bootstrap. Os documentos iniciais foram gerados por `/solo-dev-assistant start` como seeds, não como especificação final.

## Próximos passos

1. Refinar visão, escopo e trade-offs com `/grill-me`.
2. Preencher glossário e invariantes com `/grill-with-docs` ou workflow equivalente.
3. Rodar `/solo-dev-assistant cycle` para escolher o próximo movimento.
""",
        "AGENTS_DOC": f"""# AGENTS.md — Instruções para agentes de IA neste projeto

Este arquivo orienta agentes trabalhando no projeto `{project}`.

## O que é o projeto

{values["ONE_LINE"]}

**Visão:** [docs/VISION.md](docs/VISION.md)
**Roadmap:** [docs/ROADMAP.md](docs/ROADMAP.md)
**Contexto de domínio:** [docs/CONTEXT.md](docs/CONTEXT.md)

## Estado inicial

Este projeto foi bootstrapado por `/solo-dev-assistant start`. Os documentos são seeds, não especificação final.

Antes de implementar código de produto:

- Refinar visão, escopo e trade-offs com `/grill-me`.
- Preencher linguagem de domínio, glossário e invariantes com `/grill-with-docs` ou `domain-model`.
- Registrar decisões fundacionais em ADRs quando houver trade-off real, difícil de reverter e surpreendente sem contexto.

## Stack

{values["STACK"]}

## Convenções iniciais

- Commits seguem Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Mudanças estruturais devem ser registradas em ADR antes da implementação quando a decisão merecer história.
- Mudanças em glossário, invariantes ou anti-conceitos atualizam `docs/CONTEXT.md` no mesmo PR.
- O roadmap é sequencial por padrão: não pular fase sem fechar ou revisar explicitamente a anterior.
- Quando `docs/ROADMAP.md` for usado como estado de execução, proponha antes de marcar uma tarefa como `🚧`, `[x]` ou `(aguardando: ...)`.

## O que fazer

- Ler `docs/VISION.md`, `docs/ROADMAP.md` e `docs/CONTEXT.md` antes de propor feature.
- Usar `/solo-dev-assistant briefing` para orientação de sessão.
- Usar `/solo-dev-assistant cycle` para escolher a próxima etapa do processo.
- Manter mudanças pequenas, revisáveis e verificáveis.
- Deixar `_TODO_` visível quando uma decisão ainda não foi tomada.

## O que NÃO fazer

- Não inventar stack, público, métricas ou requisitos que não estejam documentados.
- Não criar features de V2 antes de a V1 provar valor.
- Não commitar segredos.
- Não desabilitar hooks, testes ou CI para fechar trabalho.

## Skills sugeridas

- `/grill-me` para refinar visão, roadmap e trade-offs.
- `/grill-with-docs` para glossário, invariantes e linguagem de domínio.
- `/solo-dev-assistant cycle` para decidir o próximo movimento.
- `/solo-dev-assistant briefing` quando o roadmap estiver sendo usado como fonte de estado de execução.
""",
        "VISION_DOC": f"""# Visão — {project}

## Resumo

{project} é um projeto em bootstrap para resolver: {values["PROBLEM"]}

## Por que existe

1. **Problema:** {values["PROBLEM"]}
2. **Público-alvo:** {values["AUDIENCE"]}
3. **Resultado esperado:** {values["V1_SUCCESS"]}

## Público-alvo

{values["AUDIENCE"]}

## Atributos não-funcionais

{values["NON_FUNCTIONALS"]}

## O que NÃO é

{values["ANTI_SCOPE"]}

## Critério de sucesso da V1

{values["V1_SUCCESS"]}

Sem esse critério atendido, V2 fica congelada.
""",
        "ROADMAP_DOC": f"""# Roadmap — {project}

> Seed provisório gerado por `/solo-dev-assistant start`.
> Ele existe para orientar as primeiras sessões do projeto, não para ser o roadmap final.
> Refine ou substitua este conteúdo com skills/workflows mais específicos como `grill-me`, `grill-with-docs`, `domain-model`, `to-prd`, `to-issues`, GSD ou Spec Kit.

Roadmap em fases sequenciais. Cada fase só começa quando a anterior está fechada em um ambiente validável ou explicitamente revisada.

Para a visão de longo prazo, ver [VISION.md](VISION.md). Para glossário e invariantes, ver [CONTEXT.md](CONTEXT.md).

---

## Fase 0 — Fundação

Objetivo: transformar a intenção inicial em base de projeto executável.

- [ ] Refinar VISION.md e ROADMAP.md com `/grill-me` `@human`
- [ ] Preencher CONTEXT.md com `/grill-with-docs` `@human`
- [ ] Decidir stack fundacional e registrar ADR-0001 se houver trade-off real `@human`
- [ ] Criar repositório git, licença e CI mínimo `@human`
- [ ] Montar ambiente local reproduzível `@human`

## Fase 1 — Primeira versão utilizável

Objetivo: entregar o fluxo mínimo que resolve o problema central para o público-alvo.

- [ ] Implementar o fluxo central para: {values["PROBLEM"]} `@human`
- [ ] Validar o fluxo com: {values["AUDIENCE"]} `@human`
- [ ] Publicar uma versão utilizável em ambiente real ou demo controlada `@human`
- [ ] Medir o critério de sucesso da V1: {values["V1_SUCCESS"]} `@human`

## Fase 2 — Endurecimento e polimento

Objetivo: reduzir fricção de uso, operação e manutenção após a V1.

- [ ] Melhorar onboarding e primeira experiência `@human`
- [ ] Adicionar observabilidade, métricas mínimas e recuperação `@human`
- [ ] Documentar operação e suporte `@human`
- [ ] Revisar anti-escopo antes de expandir funcionalidades `@human`

## Fase 3 — Expansão

Objetivo: ampliar o produto apenas depois de a V1 provar valor.

- [ ] Reavaliar aprendizados da V1 `@human`
- [ ] Decidir se o anti-escopo continua válido `@human`
- [ ] Registrar ADRs para mudanças estruturais `@human`
- [ ] Planejar a próxima fase com base em uso real `@human`

---

## Política de escopo

Ideias fora da fase corrente ficam estacionadas até a fase atual fechar. Não antecipe expansão antes de validar V1.
""",
        "CONTEXT_DOC": f"""# Contexto — {project}

Este arquivo é o lar do vocabulário e das invariantes de domínio do projeto.

> Esqueleto inicial. Preencher via `/grill-with-docs` ou workflow equivalente antes de implementar regras de domínio duradouras.

## Glossário

- _TODO: preencher via `/grill-with-docs`._

## Invariantes de domínio

- _TODO: preencher via `/grill-with-docs`._

## Anti-conceitos

Coisas que parecem parte do domínio, mas explicitamente não são:

- {values["ANTI_SCOPE"]}
- _TODO: revisar e expandir via `/grill-with-docs`._

## Perguntas em aberto

- _TODO: registrar perguntas que bloqueiam modelagem de domínio._
""",
    }


def en_docs(values: dict[str, str]) -> dict[str, str]:
    project = values["PROJECT_NAME"]
    return {
        "README_DOC": f"""# {project}

{values["ONE_LINE"]}

![CI](https://img.shields.io/badge/ci-TODO-lightgrey)
![License](https://img.shields.io/badge/license-TODO-lightgrey)

## Documents

- [Vision](docs/VISION.md)
- [Roadmap](docs/ROADMAP.md)
- [Domain context](docs/CONTEXT.md)
- [Agent instructions](AGENTS.md)

## Status

This project is bootstrapping. The initial documents were generated by `/solo-dev-assistant start` as seeds, not as final specifications.

## Next Steps

1. Refine vision, scope, and trade-offs with `/grill-me`.
2. Fill glossary and invariants with `/grill-with-docs` or an equivalent workflow.
3. Run `/solo-dev-assistant cycle` to choose the next movement.
""",
        "AGENTS_DOC": f"""# AGENTS.md — Instructions for AI agents in this project

This file guides agents working on `{project}`.

## What This Project Is

{values["ONE_LINE"]}

**Vision:** [docs/VISION.md](docs/VISION.md)
**Roadmap:** [docs/ROADMAP.md](docs/ROADMAP.md)
**Domain context:** [docs/CONTEXT.md](docs/CONTEXT.md)

## Initial State

This project was bootstrapped by `/solo-dev-assistant start`. These docs are seeds, not final specifications.

Before implementing product code:

- Refine vision, scope, and trade-offs with `/grill-me`.
- Fill domain language, glossary, and invariants with `/grill-with-docs` or `domain-model`.
- Record foundational ADRs when a decision has a real trade-off, is hard to reverse, and would surprise a future reader without context.

## Stack

{values["STACK"]}

## Initial Conventions

- Commits follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Structural decisions should be recorded in ADRs when they deserve history.
- Changes to glossary, invariants, or anti-concepts update `docs/CONTEXT.md` in the same PR.
- The roadmap is sequential by default: do not skip a phase without closing or explicitly revising the previous one.
- When `docs/ROADMAP.md` is used as execution state, propose before marking a task as `🚧`, `[x]`, or `(waiting: ...)`.

## What To Do

- Read `docs/VISION.md`, `docs/ROADMAP.md`, and `docs/CONTEXT.md` before proposing features.
- Use `/solo-dev-assistant briefing` for session orientation.
- Use `/solo-dev-assistant cycle` to choose the next process step.
- Keep changes small, reviewable, and verifiable.
- Leave `_TODO_` visible when a decision has not been made yet.

## What Not To Do

- Do not invent stack, audience, metrics, or requirements that are not documented.
- Do not create V2 features before V1 proves value.
- Do not commit secrets.
- Do not disable hooks, tests, or CI to close work.

## Suggested Skills

- `/grill-me` to refine vision, roadmap, and trade-offs.
- `/grill-with-docs` for glossary, invariants, and domain language.
- `/solo-dev-assistant cycle` to decide the next movement.
- `/solo-dev-assistant briefing` when the roadmap is being used as execution state.
""",
        "VISION_DOC": f"""# Vision — {project}

## Summary

{project} is a bootstrapping project to solve: {values["PROBLEM"]}

## Why It Exists

1. **Problem:** {values["PROBLEM"]}
2. **Target audience:** {values["AUDIENCE"]}
3. **Expected result:** {values["V1_SUCCESS"]}

## Target Audience

{values["AUDIENCE"]}

## Non-Functional Attributes

{values["NON_FUNCTIONALS"]}

## What This Is NOT

{values["ANTI_SCOPE"]}

## V1 Success Criterion

{values["V1_SUCCESS"]}

Until this criterion is met, V2 stays frozen.
""",
        "ROADMAP_DOC": f"""# Roadmap — {project}

> Provisional seed generated by `/solo-dev-assistant start`.
> It exists to orient the first project sessions, not to be the final roadmap.
> Refine or replace this content with more specific skills/workflows such as `grill-me`, `grill-with-docs`, `domain-model`, `to-prd`, `to-issues`, GSD, or Spec Kit.

Roadmap in sequential phases. Each phase starts only when the previous one is closed in a validatable environment or explicitly revised.

For long-term vision, see [VISION.md](VISION.md). For glossary and invariants, see [CONTEXT.md](CONTEXT.md).

---

## Phase 0 — Foundation

Goal: turn the initial intent into an executable project base.

- [ ] Refine VISION.md and ROADMAP.md with `/grill-me` `@human`
- [ ] Fill CONTEXT.md with `/grill-with-docs` `@human`
- [ ] Decide foundational stack and record ADR-0001 if there is a real trade-off `@human`
- [ ] Create git repository, license, and minimal CI `@human`
- [ ] Set up a reproducible local environment `@human`

## Phase 1 — First Usable Version

Goal: ship the smallest flow that solves the central problem for the target audience.

- [ ] Implement the central flow for: {values["PROBLEM"]} `@human`
- [ ] Validate the flow with: {values["AUDIENCE"]} `@human`
- [ ] Publish a usable version in a real environment or controlled demo `@human`
- [ ] Measure the V1 success criterion: {values["V1_SUCCESS"]} `@human`

## Phase 2 — Hardening and Polish

Goal: reduce usage, operations, and maintenance friction after V1.

- [ ] Improve onboarding and first-run experience `@human`
- [ ] Add minimum observability, metrics, and recovery `@human`
- [ ] Document operations and support `@human`
- [ ] Revisit anti-scope before expanding functionality `@human`

## Phase 3 — Expansion

Goal: expand only after V1 proves value.

- [ ] Reassess V1 learnings `@human`
- [ ] Decide whether anti-scope still holds `@human`
- [ ] Record ADRs for structural changes `@human`
- [ ] Plan the next phase from real usage `@human`

---

## Scope Policy

Ideas outside the current phase stay parked until the current phase closes. Do not anticipate expansion before validating V1.
""",
        "CONTEXT_DOC": f"""# Context — {project}

This file is the home for the project's domain vocabulary and invariants.

> Initial skeleton. Fill with `/grill-with-docs` or an equivalent workflow before implementing durable domain rules.

## Glossary

- _TODO: fill with `/grill-with-docs`._

## Domain Invariants

- _TODO: fill with `/grill-with-docs`._

## Anti-Concepts

Things that may look like part of the domain, but explicitly are not:

- {values["ANTI_SCOPE"]}
- _TODO: review and expand with `/grill-with-docs`._

## Open Questions

- _TODO: record questions that block domain modeling._
""",
    }


def template_values(answers: Answers, target: Path) -> dict[str, str]:
    locale = detect_language(answers)
    project_name = clean_project_name(answers.project_name, target)
    if locale == "en":
        problem = clean_optional(answers.problem, "describe the problem in one sentence")
        audience = clean_optional(answers.audience, "describe the target audience")
        v1_success = clean_optional(answers.v1_success, "define a concrete V1 success criterion")
        anti_scope = clean_optional(answers.anti_scope, "make anti-scope explicit")
        stack = clean_optional(answers.stack, "decide the stack and record ADR-0001")
        non_functionals = clean_optional(
            answers.non_functionals,
            "identify non-functional attributes if relevant",
        )
    else:
        problem = clean_optional(answers.problem, "descrever problema em uma frase")
        audience = clean_optional(answers.audience, "descrever publico-alvo")
        v1_success = clean_optional(answers.v1_success, "definir criterio concreto de sucesso da V1")
        anti_scope = clean_optional(answers.anti_scope, "explicitar anti-escopo")
        stack = clean_optional(answers.stack, "decidir stack e registrar ADR-0001")
        non_functionals = clean_optional(
            answers.non_functionals,
            "levantar atributos nao-funcionais se forem relevantes",
        )

    values = {
        "LANGUAGE": locale,
        "PROJECT_NAME": project_name,
        "PROBLEM": problem,
        "AUDIENCE": audience,
        "V1_SUCCESS": v1_success,
        "ANTI_SCOPE": anti_scope,
        "STACK": stack,
        "NON_FUNCTIONALS": non_functionals,
        "ONE_LINE": f"{project_name}: {problem}",
    }
    values.update(en_docs(values) if locale == "en" else pt_docs(values))
    return values


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
        "language",
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
        language=str(data.get("language") or ""),
    )


def write_docs(target: Path, answers: Answers, force: bool) -> tuple[list[Path], str]:
    skill_dir = Path(__file__).resolve().parents[1]
    template_dir = skill_dir / "templates"

    destinations = [target / destination for _, destination, _ in DOCS]
    existing = [path for path in destinations if path.exists()]
    if existing and not force:
        existing_list = ", ".join(str(path.relative_to(target)) for path in existing)
        raise RuntimeError(f"arquivos ja existem: {existing_list}; confirme e rode com --force")

    values = template_values(answers, target)
    written: list[Path] = []
    for template_name, relative_destination, value_key in DOCS:
        template_path = template_dir / f"{template_name}.tmpl"
        rendered = render_template(template_path.read_text(encoding="utf-8"), values).rstrip() + "\n"
        destination = target / relative_destination
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(rendered, encoding="utf-8")
        written.append(destination)
    return written, values["LANGUAGE"]


def print_handoff(target: Path, written: list[Path], locale: str) -> None:
    def rel(path: Path) -> str:
        try:
            return str(path.relative_to(target))
        except ValueError:
            return str(path)

    if locale == "en":
        print("✓ 5 documents generated:")
        for path in written:
            suffix = " (skeleton)" if path.name == "CONTEXT.md" else ""
            print(f"  - {rel(path)}{suffix}")
        print()
        print("Suggested next steps:")
        print("  1. Refine vision, scope, and trade-offs → /grill-me")
        print("  2. Fill glossary and invariants → /grill-with-docs")
        print("  3. Decide the next process movement → /solo-dev-assistant cycle")
        print("  4. When execution starts → /solo-dev-assistant briefing")
        return

    print("✓ 5 documentos gerados:")
    for path in written:
        suffix = " (esqueleto)" if path.name == "CONTEXT.md" else ""
        print(f"  - {rel(path)}{suffix}")
    print()
    print("Próximos passos sugeridos:")
    print("  1. Refinar visão, escopo e trade-offs → /grill-me")
    print("  2. Preencher glossário e invariantes → /grill-with-docs")
    print("  3. Decidir o próximo movimento do processo → /solo-dev-assistant cycle")
    print("  4. Quando começar a executar → /solo-dev-assistant briefing")


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
    parser.add_argument("--language", help="optional language hint: pt-BR or en")
    parser.add_argument("--force", action="store_true", help="overwrite existing generated docs")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    target = Path(args.target).resolve()
    target.mkdir(parents=True, exist_ok=True)

    try:
        answers = collect_interactively(load_answers(args))
        written, locale = write_docs(target, answers, force=args.force)
    except Exception as exc:  # noqa: BLE001 - command-line operator feedback
        print(f"Erro ao executar start: {exc}", file=sys.stderr)
        return 1

    print_handoff(target, written, locale)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
