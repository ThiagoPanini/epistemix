import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CodeBlock } from "@/app/_components/code-block";
import { slugify } from "./slug";

export const mdxComponents = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 id={props.id ?? slugify(toText(props.children))} {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 id={props.id ?? slugify(toText(props.children))} {...props} />
  ),
  pre: (props: ComponentPropsWithoutRef<"pre">) => <CodeBlock {...props} />,
};

function toText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  return "";
}
