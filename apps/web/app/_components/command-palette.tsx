"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PaletteItem } from "@/lib/site/palette";

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

interface Props {
  items: PaletteItem[];
  onClose: () => void;
}

export function CommandPalette({ items, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selIdx, setSelIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = normalize(query.trim());
  const filtered = q
    ? items.filter(
        (item) =>
          normalize(item.title).includes(q) ||
          normalize(item.section).includes(q) ||
          (item.detail ? normalize(item.detail).includes(q) : false),
      )
    : items;

  const groups = new Map<string, PaletteItem[]>();
  for (const item of filtered) {
    if (!groups.has(item.section)) groups.set(item.section, []);
    groups.get(item.section)?.push(item);
  }

  function go(item: PaletteItem) {
    router.push(item.href);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      go(filtered[selIdx]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  let flatIdx = 0;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: scrim click-outside pattern; keyboard close is handled by input onKeyDown
    <div className="scrim" onClick={onClose}>
      <div
        className="pal"
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="pal-in">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar posts, seções..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelIdx(0);
            }}
            onKeyDown={onKeyDown}
            aria-label="Buscar"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="pal-empty mono">Nenhum resultado encontrado.</div>
        ) : (
          <div className="pal-list">
            {Array.from(groups.entries()).map(([section, sectionItems]) => (
              <div key={section}>
                <div className="pal-group">{section}</div>
                {sectionItems.map((item) => {
                  const idx = flatIdx++;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      className={`pal-item${idx === selIdx ? " sel" : ""}`}
                      onMouseEnter={() => setSelIdx(idx)}
                      onClick={() => go(item)}
                    >
                      <span className="t">{item.title}</span>
                      {item.detail && <span className="d">{item.detail}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div className="pal-foot">
          <span>
            <kbd>↵</kbd> abrir
          </span>
          <span>
            <kbd>↑↓</kbd> navegar
          </span>
          <span>
            <kbd>esc</kbd> fechar
          </span>
        </div>
      </div>
    </div>
  );
}
