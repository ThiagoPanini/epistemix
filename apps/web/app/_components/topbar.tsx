"use client";

import Link from "next/link";
import { AccountNav } from "./account-nav";

const GITHUB_URL = "https://github.com/ThiagoPanini/epistemix";

interface TopbarProps {
  onPaletteOpen?: () => void;
}

export function Topbar({ onPaletteOpen }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-in wrap">
        <Link href="/" className="brand">
          epistemix
        </Link>
        <span className="spacer" aria-hidden="true" />
        <button
          type="button"
          className="kbtn"
          aria-label="Abrir paleta de comandos"
          onClick={onPaletteOpen}
        >
          <span>Buscar</span>
          <kbd>⌘K</kbd>
        </button>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="kbtn gh-hide"
          aria-label="GitHub"
        >
          GITHUB
        </a>
        <AccountNav />
      </div>
    </header>
  );
}
