"use client";
import Link from "next/link";

export function TagLink({ slug, label }: { slug: string; label: string }) {
  return (
    <Link href={`/tags/${slug}`} className="tag" onClick={(e) => e.stopPropagation()}>
      {label}
    </Link>
  );
}
