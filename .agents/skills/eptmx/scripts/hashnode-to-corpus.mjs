#!/usr/bin/env node
// hashnode-to-corpus.mjs — converte o export nativo do Hashnode (JSON) em arquivos
// .md, um por Post, dentro do corpus/ da skill eptmx — para calibrar references/STYLE.md.
//
// Por que JSON e não scraping: o blog está atrás do Cloudflare e a GraphQL gratuita do
// Hashnode foi aposentada (2026-05). O export nativo (Dashboard → "Export Your Data" →
// "Create new export") entrega tudo num JSON, sem auth nem scraping. Este script só
// transforma esse JSON em markdown legível.
//
// Uso:
//   node hashnode-to-corpus.mjs <export.json> [--out <dir>] [--no-frontmatter]
//
//   <export.json>      caminho do JSON baixado do Hashnode (obrigatório)
//   --out <dir>        destino (default: ../corpus relativo a este script)
//   --no-frontmatter   grava só o corpo, sem o bloco YAML de metadata
//
// Zero dependências: roda com qualquer Node 18+. É deliberadamente tolerante a variações
// de schema — se o formato do export mudou, ele imprime as chaves detectadas para ajuste.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- args ----------
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));
const exportPath = positional[0];
const outFlagIdx = args.indexOf("--out");
const outDir = outFlagIdx !== -1 ? resolve(args[outFlagIdx + 1]) : resolve(__dirname, "..", "corpus");
const withFrontmatter = !flags.has("--no-frontmatter");

if (!exportPath) {
  console.error("Uso: node hashnode-to-corpus.mjs <export.json> [--out <dir>] [--no-frontmatter]");
  process.exit(1);
}
if (!existsSync(exportPath)) {
  console.error(`Arquivo não encontrado: ${exportPath}`);
  process.exit(1);
}

// ---------- helpers ----------
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");
function slugify(s) {
  return String(s)
    .normalize("NFD")
    .replace(COMBINING_MARKS, "") // tira acentos (marcas combinantes)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";
}

function isoDate(v) {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString().slice(0, 10);
}

// Acha o array de posts onde quer que ele esteja no JSON exportado.
function findPosts(root) {
  if (Array.isArray(root)) return root;
  const candidates = [
    root?.posts,
    root?.publication?.posts,
    root?.data?.posts,
    root?.blog?.posts,
    root?.articles,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (Array.isArray(c?.edges)) return c.edges.map((e) => e.node ?? e); // estilo GraphQL
    if (Array.isArray(c?.nodes)) return c.nodes;
  }
  return null;
}

// Normaliza tags vindas como string, array de strings ou array de objetos.
function normalizeTags(tags) {
  if (!tags) return [];
  const arr = Array.isArray(tags) ? tags : [tags];
  return arr
    .map((t) => (typeof t === "string" ? t : t?.name ?? t?.label ?? t?.slug ?? ""))
    .filter(Boolean);
}

function pickSeries(post) {
  const s = post.series ?? post.seriesName ?? post.publicationSeries;
  if (!s) return undefined;
  return typeof s === "string" ? s : s.name ?? s.title ?? s.slug ?? undefined;
}

function looksLikeHtml(s) {
  return /<(p|h[1-6]|ul|ol|li|pre|img|a|strong|em|b|i|blockquote|div|br|figure)\b[^>]*>/i.test(s);
}

// Conversor HTML→Markdown mínimo. Rede de segurança: só roda se o export NÃO trouxer um
// campo já em markdown. É lossy de propósito — o objetivo é capturar a VOZ, não round-trip
// perfeito. Se cair muito aqui, melhor re-exportar/relatar do que confiar 100% no resultado.
function htmlToMarkdown(html) {
  let s = html;
  s = s.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, c) => `\n\`\`\`\n${decode(c)}\n\`\`\`\n`);
  s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, c) => `\n\`\`\`\n${decode(c)}\n\`\`\`\n`);
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => `\`${decode(c)}\``);
  for (let i = 1; i <= 6; i++) {
    s = s.replace(new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, "gi"), (_, c) => `\n${"#".repeat(i)} ${strip(c)}\n`);
  }
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `**${strip(c)}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `*${strip(c)}*`);
  s = s.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, c) => `[${strip(c)}](${href})`);
  s = s.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, (_, alt, src) => `![${alt}](${src})`);
  s = s.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (_, src) => `![](${src})`);
  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => `\n> ${strip(c)}\n`);
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `- ${strip(c)}\n`);
  s = s.replace(/<\/?(ul|ol)[^>]*>/gi, "\n");
  s = s.replace(/<hr[^>]*>/gi, "\n---\n");
  s = s.replace(/<\/p>/gi, "\n\n").replace(/<p[^>]*>/gi, "");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, ""); // remove o que sobrou
  s = decode(s);
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

function strip(c) {
  return decode(c.replace(/<[^>]+>/g, "")).trim();
}
function decode(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function yamlValue(v) {
  if (Array.isArray(v)) return `[${v.map((x) => JSON.stringify(x)).join(", ")}]`;
  return /[:#"'\n]/.test(String(v)) ? JSON.stringify(v) : String(v);
}

// ---------- run ----------
let root;
try {
  root = JSON.parse(readFileSync(exportPath, "utf8"));
} catch (e) {
  console.error(`JSON inválido em ${exportPath}: ${e.message}`);
  process.exit(1);
}

const posts = findPosts(root);
if (!posts) {
  console.error("Não encontrei um array de posts no JSON. Chaves de topo detectadas:");
  console.error("  " + Object.keys(root ?? {}).join(", "));
  console.error("Me mostre essa saída que eu ajusto o findPosts() ao seu formato.");
  process.exit(2);
}

// Transparência: mostra o schema do primeiro post para conferência/ajuste.
console.log(`Posts encontrados: ${posts.length}`);
if (posts[0]) console.log(`Campos do 1º post: ${Object.keys(posts[0]).join(", ")}\n`);

mkdirSync(outDir, { recursive: true });

const used = new Set();
let htmlFallbacks = 0;
let written = 0;

for (const post of posts) {
  const title = post.title ?? post.name ?? "Sem título";
  let slug = post.slug ?? slugify(title);
  while (used.has(slug)) slug = `${slug}-2`;
  used.add(slug);

  const rawMd = post.contentMarkdown ?? post.markdown ?? post.bodyMarkdown ?? post.content ?? post.body ?? "";
  let body = String(rawMd);
  if (body && looksLikeHtml(body) && !/^#{1,6}\s|\n#{1,6}\s|```/.test(body)) {
    body = htmlToMarkdown(body);
    htmlFallbacks++;
  }

  let out = "";
  if (withFrontmatter) {
    const fm = {
      title,
      slug,
      date: isoDate(post.dateAdded ?? post.publishedAt ?? post.date ?? post.dateUpdated),
      tags: normalizeTags(post.tags),
      series: pickSeries(post),
    };
    const lines = Object.entries(fm)
      .filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))
      .map(([k, v]) => `${k}: ${yamlValue(v)}`);
    out += `---\n${lines.join("\n")}\n---\n\n`;
  }
  out += body.trim() + "\n";

  writeFileSync(join(outDir, `${slug}.md`), out, "utf8");
  written++;
}

console.log(`✓ ${written} posts gravados em ${outDir}`);
if (htmlFallbacks) {
  console.log(`⚠ ${htmlFallbacks} post(s) vieram como HTML e passaram pela conversão lossy.`);
  console.log("  Se a voz ficar estranha nesses, me avise — dá pra refinar a conversão.");
}
console.log("\nPróximo passo: peça para re-destilar references/STYLE.md a partir do corpus/.");
