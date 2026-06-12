"use client";
import { type ComponentPropsWithoutRef, useRef } from "react";
import { CopyButton } from "./copy-button";

export function CodeBlock(props: ComponentPropsWithoutRef<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);

  function getText() {
    return preRef.current?.querySelector("code")?.textContent ?? "";
  }

  return (
    <div className="code-wrap">
      <CopyButton getText={getText} />
      <pre ref={preRef} {...props} />
    </div>
  );
}
