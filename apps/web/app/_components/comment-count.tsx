"use client";

import { useEffect, useState } from "react";
import type { Comment } from "./comment-section";

// Renders the comment tally in the `.engage` bar without blocking the server
// render. Mirrors ViewTracker: the count loads client-side so the page stays
// statically generated and the article paints immediately.
export function CommentCount({ artifactId }: { artifactId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/comments/${artifactId}`)
      .then((r) => r.json())
      .then((data: Comment[]) => setCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [artifactId]);

  if (count === null) return <span className="eng-stat">— comentários</span>;
  return (
    <span className="eng-stat">
      {count} {count === 1 ? "comentário" : "comentários"}
    </span>
  );
}
