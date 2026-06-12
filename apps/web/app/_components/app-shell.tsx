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
        <span>© 2026 epistemix</span>
        <span className="spacer" aria-hidden="true" />
        <a href="https://github.com/ThiagoPanini/epistemix" rel="noreferrer" target="_blank">
          github.com/ThiagoPanini/epistemix
        </a>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteItems = usePaletteItems();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen]);

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
