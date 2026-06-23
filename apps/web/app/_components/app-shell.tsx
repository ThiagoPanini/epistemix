"use client";

import { useEffect, useState } from "react";
import { usePaletteItems } from "@/app/providers";
import { CommandPalette } from "./command-palette";
import { Rubrics } from "./rubrics";
import { Topbar } from "./topbar";

function Footer() {
  return (
    <footer className="foot">
      <div className="foot-in wrap">
        <a href="https://github.com/ThiagoPanini/ethitorial" rel="noreferrer" target="_blank">
          GITHUB.COM/THIAGOPANINI/ETHITORIAL
        </a>
        <span>MIT LICENSE</span>
        <span className="spacer" aria-hidden="true" />
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const paletteItems = usePaletteItems();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!playerOpen) setPaletteOpen((open) => !open);
      }
      if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, playerOpen]);

  useEffect(() => {
    function onPlayerState(event: Event) {
      const detail = (event as CustomEvent<{ open: boolean }>).detail;
      setPlayerOpen(detail.open);
      if (detail.open) setPaletteOpen(false);
    }
    window.addEventListener("epx:player-state", onPlayerState);
    return () => window.removeEventListener("epx:player-state", onPlayerState);
  }, []);

  return (
    <div data-motion="on">
      <Topbar onPaletteOpen={() => setPaletteOpen((open) => !open)} />
      <Rubrics />
      <div className="view">{children}</div>
      <Footer />
      {paletteOpen && <CommandPalette items={paletteItems} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
