"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Cursos", href: "/courses" },
  { label: "Livros", href: "/books" },
  { label: "Certificações", href: "/certifications" },
  { label: "Apresentações", href: "/talks" },
  { label: "Cronologia", href: "/timeline" },
  { label: "Grafo", href: "/graph" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Rubrics() {
  const pathname = usePathname();

  return (
    <nav className="rubrics" aria-label="Rubricas">
      <div className="rubrics-in wrap">
        {NAV_ITEMS.map(({ label, href }) => (
          <Link key={href} href={href} className={`rub${isActive(pathname, href) ? " on" : ""}`}>
            {label}
          </Link>
        ))}
        <span className="rub-gap" aria-hidden="true" />
      </div>
    </nav>
  );
}
