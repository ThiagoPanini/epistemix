// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Presentation } from "@/lib/catalog";
import { PresentationPlayer } from "./presentation-player";

const PRESENTATION: Presentation = {
  slug: "ethitorial-visao",
  sectionSlug: "presentations",
  title: "ethitorial — visão e arquitetura",
  date: "2026-06-11",
  status: "published",
  tags: ["ai"],
  summary: "Resumo",
  slides: [
    { order: 1, eyebrow: "intro", title: "Intro", body: "Primeiro slide", bullets: [] },
    { order: 2, eyebrow: "fim", title: "Fim", body: "Segundo slide", bullets: ["A", "B"] },
  ],
};

describe("PresentationPlayer", () => {
  it("navigates with keyboard and buttons", () => {
    render(<PresentationPlayer onExit={() => {}} presentation={PRESENTATION} />);

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Slide anterior" }));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    const onExit = vi.fn();
    render(<PresentationPlayer onExit={onExit} presentation={PRESENTATION} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("resumes from localStorage", () => {
    window.localStorage.setItem("epx:player:ethitorial-visao", "1");

    render(<PresentationPlayer onExit={() => {}} presentation={PRESENTATION} />);

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });
});
