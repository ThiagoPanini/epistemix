import Image from "next/image";
import type { CSSProperties, SVGProps } from "react";
import { contentAssetUrl } from "@/lib/content-assets";
import type { SectionIcon, SiteSource } from "@/lib/site/model";

export type IconName =
  | SectionIcon
  | "arrowRight"
  | "arrowUpRight"
  | "check"
  | "chevronLeft"
  | "chevronRight"
  | "clock"
  | "comment"
  | "copy"
  | "doc"
  | "enter"
  | "external"
  | "eye"
  | "github"
  | "hammer"
  | "hash"
  | "info"
  | "layers"
  | "lock"
  | "menu"
  | "search"
  | "sparkle"
  | "vote"
  | "x";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  const filled = name === "github";

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 16 16"
      width={size}
      {...props}
    >
      {filled ? (
        <g fill="currentColor" stroke="none">
          {iconPath(name)}
        </g>
      ) : (
        iconPath(name)
      )}
    </svg>
  );
}

function iconPath(name: IconName) {
  switch (name) {
    case "courses":
      return (
        <>
          <path d="M3 5.5 8 3l5 2.5L8 8 3 5.5Z" />
          <path d="M3 5.5v5L8 13l5-2.5v-5" />
          <path d="M8 8v5" />
        </>
      );
    case "books":
      return (
        <>
          <path d="M3 3.5h4A1.5 1.5 0 0 1 8.5 5v8A1.5 1.5 0 0 0 7 11.5H3v-8Z" />
          <path d="M13 3.5H9A1.5 1.5 0 0 0 7.5 5v8A1.5 1.5 0 0 1 9 11.5h4v-8Z" />
        </>
      );
    case "certs":
      return (
        <>
          <circle cx="8" cy="6.5" r="3.5" />
          <path d="M6 9.5 5 14l3-1.6L11 14l-1-4.5" />
        </>
      );
    case "blog":
      return (
        <>
          <path d="M3 3.5h10v9H3z" />
          <path d="M5.5 6.5h5M5.5 9h5M5.5 11h3" />
        </>
      );
    case "present":
      return (
        <>
          <rect height="7.5" rx="1" width="11" x="2.5" y="3" />
          <path d="M8 10.5v2M5.5 13h5" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="7.2" cy="7.2" r="4.2" />
          <path d="m10.6 10.6 2.4 2.4" />
        </>
      );
    case "arrowRight":
      return <path d="M3.5 8h9m-3.5-3.5L12.5 8 9 11.5" />;
    case "arrowUpRight":
      return <path d="M5 11 11 5m-4.5 0H11v4.5" />;
    case "external":
      return (
        <>
          <path d="M9 3.5h3.5V7" />
          <path d="M12.5 3.5 7 9" />
          <path d="M11 9v2.5a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1H7" />
        </>
      );
    case "copy":
      return (
        <>
          <rect height="7" rx="1.3" width="7" x="5.5" y="5.5" />
          <path d="M3.5 9.5V4a1 1 0 0 1 1-1H10" />
        </>
      );
    case "check":
      return <path d="m3.5 8.5 3 3 6-6.5" />;
    case "chevronLeft":
      return <path d="M10 3.5 5.5 8l4.5 4.5" />;
    case "chevronRight":
      return <path d="M6 3.5 10.5 8 6 12.5" />;
    case "x":
      return <path d="m4 4 8 8M12 4l-8 8" />;
    case "vote":
      return <path d="M8 3.5 13 9H9.5v3.5h-3V9H3L8 3.5Z" />;
    case "comment":
      return <path d="M3 4.5h10v6H7l-3 2.5v-2.5H3v-6Z" />;
    case "github":
      return (
        <path d="M8 1.6a6.4 6.4 0 0 0-2 12.48c.32.06.44-.14.44-.31v-1.2c-1.78.39-2.16-.85-2.16-.85-.29-.74-.71-.94-.71-.94-.58-.4.04-.39.04-.39.64.05.98.66.98.66.57.98 1.5.7 1.86.53.06-.41.22-.7.4-.86-1.42-.16-2.92-.71-2.92-3.16 0-.7.25-1.27.66-1.72-.07-.16-.29-.82.06-1.7 0 0 .54-.18 1.76.66a6.1 6.1 0 0 1 3.2 0c1.22-.84 1.76-.66 1.76-.66.35.88.13 1.54.06 1.7.41.45.66 1.02.66 1.72 0 2.46-1.5 3-2.93 3.16.23.2.43.58.43 1.18v1.75c0 .17.12.38.45.31A6.4 6.4 0 0 0 8 1.6Z" />
      );
    case "info":
      return (
        <>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 7.2v3.6M8 5.2v.2" />
        </>
      );
    case "hammer":
      return (
        <>
          <path d="M9.5 3 13 6.5 11.5 8 8 4.5 9.5 3Z" />
          <path d="m8 5.5-5 5 1.5 1.5 5-5" />
        </>
      );
    case "lock":
      return (
        <>
          <rect height="6" rx="1.2" width="9" x="3.5" y="7" />
          <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
        </>
      );
    case "menu":
      return <path d="M3 4.5h10M3 8h10M3 11.5h10" />;
    case "sparkle":
      return <path d="M8 2.5 9 6l3.5 1L9 8l-1 3.5L7 8 3.5 7 7 6 8 2.5Z" />;
    case "layers":
      return (
        <>
          <path d="M8 2.5 13.5 6 8 9.5 2.5 6 8 2.5Z" />
          <path d="m2.5 9 5.5 3.5L13.5 9" />
        </>
      );
    case "eye":
      return (
        <>
          <path d="M1.5 8S4 4 8 4s6.5 4 6.5 4-2.5 4-6.5 4-6.5-4-6.5-4Z" />
          <circle cx="8" cy="8" r="1.7" />
        </>
      );
    case "clock":
      return (
        <>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 5v3l2 1.4" />
        </>
      );
    case "doc":
      return (
        <>
          <path d="M4 2.5h5L12 5.5V13H4V2.5Z" />
          <path d="M8.5 2.5V6H12" />
        </>
      );
    case "hash":
      return <path d="M6 3 4.5 13M11 3 9.5 13M3.5 6h9M3 10h9" />;
    case "enter":
      return <path d="M12.5 4v3.5a1 1 0 0 1-1 1H4m0 0 2.5-2.5M4 8.5 6.5 11" />;
  }
}

export function BrandMark() {
  return (
    <span className="brand-mark">
      <svg
        aria-hidden="true"
        fill="none"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        viewBox="0 0 16 16"
      >
        <path d="M8 2.2 13.5 5.4v5.2L8 13.8 2.5 10.6V5.4L8 2.2Z" />
        <path d="M8 8 13.5 5.4M8 8v5.8M8 8 2.5 5.4" stroke="rgba(255,255,255,0.55)" />
      </svg>
    </span>
  );
}

export function Wordmark() {
  return <span className="wordmark">epistemix</span>;
}

export function Avatar({
  name,
  hue = 256,
  size,
  src,
}: {
  name: string;
  hue?: number;
  size?: number;
  src?: string;
}) {
  const initials = initialsOf(name);
  const style = {
    background: `linear-gradient(150deg, oklch(0.6 0.16 ${hue}), oklch(0.45 0.14 ${hue + 30}))`,
    ...(size ? { width: size, height: size, fontSize: size * 0.42 } : {}),
  };

  return (
    <span className="av" style={style}>
      {src ? (
        <Image alt={name} className="av-img" height={size ?? 16} src={src} width={size ?? 16} />
      ) : (
        initials
      )}
    </span>
  );
}

export function SourceCover({
  source,
  className = "",
  style,
}: {
  source: Pick<SiteSource, "name" | "slug" | "sectionSlug" | "cover">;
  className?: string;
  style?: CSSProperties;
}) {
  if (source.cover) {
    return (
      <div className={`src-cover ${className}`.trim()} style={style}>
        <Image
          alt={source.name}
          className="cover-img"
          fill
          sizes="(max-width: 720px) 100vw, 400px"
          src={contentAssetUrl(source.sectionSlug, source.slug, source.cover)}
        />
      </div>
    );
  }

  const [h1, h2] = coverHues(source.slug);
  const background = `radial-gradient(120% 130% at 18% 12%, oklch(0.55 0.2 ${h1}) 0%, oklch(0.42 0.17 ${h2}) 46%, oklch(0.2 0.08 ${h2}) 100%)`;

  return (
    <div className={`src-cover ${className}`.trim()} style={{ background, ...style }}>
      <div className="cover-grid" />
      <span className="mono">{initialsOf(source.name)}</span>
    </div>
  );
}

export function hueFromText(text: string, offset = 0) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return 248 + ((hash + offset) % 54);
}

function coverHues(slug: string): [number, number] {
  return [hueFromText(slug), hueFromText(slug, 28)];
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
