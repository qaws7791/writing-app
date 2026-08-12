"use client";

import { useId, useState } from "react";
import { ArrowDown01Icon, ArrowUp01Icon, Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type CodeBlockProps = {
  code: string;
  label?: string;
  joined?: boolean;
  collapsible?: boolean;
  collapsedLines?: number;
};

export default function CodeBlock({
  code,
  label = "TypeScript",
  joined = false,
  collapsible = false,
  collapsedLines = 4,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const codeId = useId();
  const lines = code.replace(/\n$/, "").split("\n");
  const canCollapse = collapsible && lines.length > collapsedLines;
  const visibleLines = canCollapse && !expanded ? lines.slice(0, collapsedLines) : lines;
  const lineOccurrences = new Map<string, number>();
  const keyedLines = visibleLines.map((line) => {
    const occurrence = (lineOccurrences.get(line) ?? 0) + 1;
    lineOccurrences.set(line, occurrence);
    return { key: `${line}-${occurrence}`, line };
  });

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      data-slot="code-block"
      data-joined={joined || undefined}
      data-expanded={expanded || undefined}
      className={
        joined ? "relative bg-muted/35" : "relative overflow-hidden rounded-3xl border bg-muted/45"
      }
    >
      <div
        className={`flex h-10 items-center justify-between px-4 text-xs text-muted-foreground ${
          joined ? "" : "border-b"
        }`}
      >
        <span>{label}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "전체 코드 복사됨" : "전체 코드 복사"}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-xl px-2.5 transition-colors hover:bg-background hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25"
        >
          <HugeiconsIcon
            icon={copied ? Tick02Icon : Copy01Icon}
            strokeWidth={1.8}
            aria-hidden="true"
            className="size-3.5"
          />
          <span className={joined ? "sr-only" : undefined}>{copied ? "복사됨" : "복사"}</span>
        </button>
      </div>
      <pre
        id={codeId}
        className={`overflow-x-hidden px-4 text-[13px] leading-6 whitespace-pre-wrap break-words ${
          canCollapse && !expanded ? "pb-8" : "pb-4"
        }`}
      >
        <code className="block w-full min-w-0">
          {keyedLines.map(({ key, line }, index) => (
            <span key={key} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
              <span aria-hidden="true" className="select-none text-right text-muted-foreground/55">
                {index + 1}
              </span>
              <span className="min-w-0 break-all">{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
      {canCollapse && (
        <div
          className={
            expanded
              ? "flex justify-center border-t border-border/70 p-3"
              : "pointer-events-none absolute inset-x-0 bottom-0 flex h-24 items-end justify-center bg-linear-to-t from-muted via-muted/95 to-transparent pb-3"
          }
        >
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={codeId}
            onClick={() => setExpanded((value) => !value)}
            className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-xl border bg-background px-3 text-xs font-medium text-foreground shadow-xs transition-[background-color,border-color,box-shadow] hover:bg-accent/70 focus-visible:ring-3 focus-visible:ring-ring/25 active:shadow-none"
          >
            {expanded ? "코드 접기" : "코드 전체 보기"}
            <HugeiconsIcon
              icon={expanded ? ArrowUp01Icon : ArrowDown01Icon}
              strokeWidth={1.8}
              aria-hidden="true"
              className="size-3.5"
            />
          </button>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "전체 코드를 클립보드에 복사했습니다." : ""}
      </span>
    </div>
  );
}
