"use client";
import { useState } from "react";

export function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(getText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="copy-btn"
      aria-label={copied ? "Copiado!" : "Copiar código"}
    >
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}
