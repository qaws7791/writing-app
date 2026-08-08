"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { DocSearchRecord } from "@/src/lib/docs-catalog";

type DocsSearchProps = {
  records: DocSearchRecord[];
  baseUrl: string;
};

export default function DocsSearch({ records, baseUrl }: DocsSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return records;

    return records.filter((record) =>
      `${record.title} ${record.href} ${record.description} ${record.category} ${record.searchText ?? ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, records]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [mounted, open]);

  const panel =
    mounted &&
    createPortal(
      <dialog
        ref={dialogRef}
        aria-label="문서 검색"
        className="fixed top-[12vh] left-1/2 z-[100] m-0 w-[min(100%-2rem,36rem)] -translate-x-1/2 overflow-hidden rounded-3xl border bg-popover p-0 text-foreground shadow-2xl backdrop:bg-background/70 backdrop:backdrop-blur-sm open:flex open:flex-col"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <div className="flex items-center gap-3 border-b px-4">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={1.8} className="size-5" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="문서, 컴포넌트, 상태 검색"
            className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            aria-label="검색 닫기"
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} className="size-4" />
          </button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length ? (
            results.map((record) => (
              <a
                key={`${record.href}-${record.title}`}
                href={`${baseUrl}${record.href.replace(/^\//, "")}`}
                className="flex items-start justify-between gap-6 rounded-2xl px-3 py-3 hover:bg-muted"
              >
                <span>
                  <span className="block text-sm font-medium">{record.title}</span>
                  <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">
                    {record.description}
                  </span>
                </span>
                <span className="mt-0.5 shrink-0 rounded-lg border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {record.category}
                </span>
              </a>
            ))
          ) : (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </p>
          )}
        </div>
      </dialog>,
      document.body,
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-2xl bg-muted px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:w-64"
      >
        <HugeiconsIcon icon={Search01Icon} strokeWidth={1.8} className="size-4" />
        <span className="truncate">문서 검색...</span>
        <kbd className="ml-auto hidden rounded-lg border bg-background px-1.5 py-0.5 font-sans text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>
      {panel}
    </>
  );
}
