"use client";
import { useEffect, useRef, useState } from "react";

interface Heading {
  id: string;
  level: 2 | 3;
  text: string;
}

export function TocSpy({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );

    const obs = observerRef.current;
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [headings]);

  return (
    <aside className="toc">
      <div className="toc-label">CONTEÚDO</div>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          data-level={h.level}
          className={activeId === h.id ? "on" : undefined}
          style={{ paddingLeft: h.level === 3 ? "24px" : "12px" }}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {h.text}
        </a>
      ))}
    </aside>
  );
}
