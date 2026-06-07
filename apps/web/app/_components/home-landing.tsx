"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteModel } from "@/lib/site/model";
import { CommandPalette } from "./command-palette";
import { PresentationPlayer } from "./presentation-player";
import { BrandMark, Icon, Wordmark } from "./primitives";
import { Aurora } from "./surfaces";

export function HomeLanding({ model }: { model: SiteModel }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!playerOpen) setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playerOpen]);

  return (
    <>
      <main className="home">
        <Aurora />
        <nav className="home-nav">
          <div className="home-brand">
            <BrandMark />
            <span className="home-brand-copy">
              <Wordmark />
              <span className="home-byline">by Thiago Panini</span>
            </span>
          </div>
          <div className="home-nav-spacer" />
          <a
            className="btn btn-ghost repo-btn"
            href={model.repoUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Icon name="github" size={14} />
            <span className="repo-label">ThiagoPanini/epistemix</span>
          </a>
        </nav>

        <div aria-hidden="true" className="home-figure">
          <Image
            alt=""
            className="home-figure-img"
            fill
            priority
            sizes="100vw"
            src="/images/greek-thinking-v2.png"
          />
          <div className="fig-tint" />
          <div className="fig-fade" />
        </div>

        <section className="home-stage">
          <div className="home-copy">
            <div className="home-badge">
              <span className="pulse" />
              Hub pessoal de aprendizado · open source
            </div>
            <h1>
              Conhecimento
              <br />
              <span className="grad">compartilhado.</span>
            </h1>
            <p className="tagline">
              Uma jornada pessoal de aprendizado, percepções e tutoriais criados para uso da
              comunidade.
            </p>
            <div className="home-cta">
              <Link className="btn btn-primary" href="/courses">
                Explorar Conteúdos <Icon name="arrowRight" size={15} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="home-foot">
          <a href={model.repoUrl} rel="noreferrer" target="_blank">
            <Icon name="github" size={14} /> ThiagoPanini/epistemix
          </a>
          <span className="spacer" />
          <span className="home-phase">Fase 1 · read-only · WCAG AA</span>
        </footer>
      </main>

      {paletteOpen && (
        <CommandPalette
          model={model}
          onClose={() => setPaletteOpen(false)}
          onOpenPlayer={() => setPlayerOpen(true)}
        />
      )}
      {playerOpen && <PresentationPlayer onExit={() => setPlayerOpen(false)} />}
    </>
  );
}
