import * as React from "react";
import { fixEscapedNewlines } from "@/lib/format";

/**
 * Markdown mínimo y seguro para las descripciones de vacantes (campo `descriptionMd`).
 * Soporta títulos (#), listas con viñetas o numeradas, **negritas**, *cursivas*, `código` y
 * enlaces http(s). Construye elementos de React (nunca HTML en crudo), por lo que el texto
 * escrito por una empresa no puede inyectar etiquetas ni scripts.
 */

/** Texto plano para vistas previas: quita la sintaxis Markdown y junta los saltos de línea. */
export function stripMarkdown(md: string | undefined | null): string {
  return fixEscapedNewlines(md)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\))/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={key}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, url] = link;
      if (/^https?:\/\//i.test(url)) {
        return (
          <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            {label}
          </a>
        );
      }
      return <React.Fragment key={key}>{label}</React.Fragment>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "p"; text: string };

function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join("\n") });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const rawLine of fixEscapedNewlines(md).replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
    } else if (bullet || numbered) {
      flushPara();
      const type = bullet ? "ul" : "ol";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return blocks;
}

export function MarkdownLite({ text, className }: { text: string | undefined | null; className?: string }) {
  const blocks = React.useMemo(() => parseBlocks(text ?? ""), [text]);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        const key = `b${i}`;
        if (b.type === "heading") {
          return b.level <= 2 ? (
            <h3 key={key} className="mt-5 mb-2 text-lg font-semibold first:mt-0">{renderInline(b.text, key)}</h3>
          ) : (
            <h4 key={key} className="mt-4 mb-1.5 text-base font-semibold first:mt-0">{renderInline(b.text, key)}</h4>
          );
        }
        if (b.type === "p") {
          return <p key={key} className="my-2 whitespace-pre-line">{renderInline(b.text, key)}</p>;
        }
        const Tag = b.type;
        return (
          <Tag key={key} className={`my-2 space-y-1 pl-5 ${b.type === "ul" ? "list-disc" : "list-decimal"}`}>
            {b.items.map((it, j) => <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>)}
          </Tag>
        );
      })}
    </div>
  );
}
