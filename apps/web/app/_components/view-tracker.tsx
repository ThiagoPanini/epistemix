"use client";

import { useEffect, useState } from "react";

function getOrCreateSid(): string {
  const match = document.cookie.match(/(?:^|;\s*)ethitorial_sid=([^;]*)/);
  if (match?.[1]) return match[1];
  const id = crypto.randomUUID();
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks Firefox support
  document.cookie = `ethitorial_sid=${id}; path=/; max-age=31536000; SameSite=Lax`;
  return id;
}

export function ViewTracker({ artifactId }: { artifactId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sid = getOrCreateSid();
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks Firefox support
    document.cookie = `ethitorial_sid=${sid}; path=/; max-age=31536000; SameSite=Lax`;

    fetch(`/api/views/${artifactId}`, { method: "POST" })
      .then(() => fetch(`/api/views/${artifactId}`))
      .then((r) => r.json())
      .then((data: { count: number }) => setCount(data.count))
      .catch(() => {});
  }, [artifactId]);

  if (count === null) return <span className="eng-stat">— leituras</span>;
  return (
    <span className="eng-stat">
      {count} {count === 1 ? "leitura" : "leituras"}
    </span>
  );
}
