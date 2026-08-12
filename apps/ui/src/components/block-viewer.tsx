"use client";

import { useEffect, useRef, useState } from "react";
import {
  ComputerIcon,
  Copy01Icon,
  ReloadIcon,
  SmartPhoneIcon,
  TabletIcon,
  TerminalIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@workspace/ui/components/primitives/button";
import { Separator } from "@workspace/ui/components/primitives/separator";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/primitives/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/primitives/tooltip";
import { cn } from "@workspace/ui/lib/utils";

import CodeBlock from "@/src/components/code-block";
import { BlockDemo, type BlockDemoSlug } from "@/src/components/login-block-demos";

type BlockViewerProps = {
  slug: BlockDemoSlug;
  title: string;
  description: string;
  installName: string;
  installCommand: string;
  code: string;
  className?: string;
};

const VIEWPORT_PRESETS = {
  desktop: 100,
  tablet: 60,
  mobile: 30,
} as const;

type ViewportPreset = keyof typeof VIEWPORT_PRESETS;

const MIN_WIDTH_PERCENT = 30;
const MAX_WIDTH_PERCENT = 100;
const MIN_WIDTH_PX = 320;

const VIEWPORT_META: Record<ViewportPreset, { label: string; icon: typeof ComputerIcon }> = {
  desktop: { label: "데스크톱", icon: ComputerIcon },
  tablet: { label: "태블릿", icon: TabletIcon },
  mobile: { label: "모바일", icon: SmartPhoneIcon },
};

function clampWidthPercent(next: number, containerWidth: number) {
  const minByPx = containerWidth > 0 ? (MIN_WIDTH_PX / containerWidth) * 100 : MIN_WIDTH_PERCENT;
  const min = Math.max(MIN_WIDTH_PERCENT, Math.min(MAX_WIDTH_PERCENT, minByPx));
  return Math.min(MAX_WIDTH_PERCENT, Math.max(min, next));
}

function matchPreset(widthPercent: number): ViewportPreset | null {
  const entry = (Object.entries(VIEWPORT_PRESETS) as [ViewportPreset, number][]).find(
    ([, size]) => Math.abs(size - widthPercent) < 0.5,
  );
  return entry?.[0] ?? null;
}

export default function BlockViewer({
  slug,
  title,
  description,
  installName,
  installCommand,
  code,
  className,
}: BlockViewerProps) {
  const [view, setView] = useState<"preview" | "code">("preview");
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [widthPercent, setWidthPercent] = useState<number>(VIEWPORT_PRESETS.desktop);
  const [activePreset, setActivePreset] = useState<ViewportPreset | null>("desktop");
  const [isResizing, setIsResizing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const widthPercentRef = useRef(widthPercent);
  const resizeStateRef = useRef<{
    startX: number;
    startWidth: number;
    containerWidth: number;
  } | null>(null);

  useEffect(() => {
    widthPercentRef.current = widthPercent;
  }, [widthPercent]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    function onPointerMove(event: PointerEvent) {
      const state = resizeStateRef.current;
      if (!state) {
        return;
      }

      const deltaPercent = ((event.clientX - state.startX) / state.containerWidth) * 100;
      const next = clampWidthPercent(state.startWidth + deltaPercent, state.containerWidth);
      setWidthPercent(next);
      setActivePreset(matchPreset(next));
    }

    function onPointerUp() {
      resizeStateRef.current = null;
      setIsResizing(false);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isResizing]);

  async function copyInstall() {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function setViewport(preset: ViewportPreset) {
    const containerWidth = containerRef.current?.offsetWidth ?? 0;
    const next = clampWidthPercent(VIEWPORT_PRESETS[preset], containerWidth);
    setWidthPercent(next);
    setActivePreset(matchPreset(next) ?? preset);
  }

  function nudgeWidth(delta: number) {
    const containerWidth = containerRef.current?.offsetWidth ?? 0;
    const next = clampWidthPercent(widthPercentRef.current + delta, containerWidth);
    setWidthPercent(next);
    setActivePreset(matchPreset(next));
  }

  const heading = description.replace(/\.$/, "");

  return (
    <TooltipProvider>
      <div
        data-slot="block-viewer"
        className={cn(
          "flex h-[calc(100svh-5rem)] max-h-[58.125rem] flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xs",
          className,
        )}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-border/70 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-2 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Tabs
              value={view}
              onValueChange={(value) => setView(value as "preview" | "code")}
              className="gap-0"
            >
              <TabsList className="h-8 rounded-lg p-0.5 *:data-[slot=tabs-indicator]:rounded-md *:data-[slot=tabs-trigger]:h-7 *:data-[slot=tabs-trigger]:rounded-md *:data-[slot=tabs-trigger]:px-2.5 *:data-[slot=tabs-trigger]:text-xs">
                <TabsTrigger value="preview">미리보기</TabsTrigger>
                <TabsTrigger value="code">코드</TabsTrigger>
              </TabsList>
            </Tabs>

            <Separator orientation="vertical" className="hidden h-4 sm:block" />

            <a
              href={`#${slug}`}
              className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/90 underline-offset-2 hover:underline"
              title={title}
            >
              <span className="md:hidden">{title}</span>
              <span className="hidden md:inline">{heading}</span>
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto">
            {view === "preview" && (
              <>
                <fieldset className="hidden items-center gap-0.5 border-0 p-0 md:flex">
                  <legend className="sr-only">미리보기 너비</legend>
                  {(Object.keys(VIEWPORT_META) as ViewportPreset[]).map((preset) => {
                    const meta = VIEWPORT_META[preset];
                    const pressed = activePreset === preset;

                    return (
                      <Tooltip key={preset}>
                        <TooltipTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              aria-label={meta.label}
                              aria-pressed={pressed}
                              onClick={() => setViewport(preset)}
                              className={cn(pressed && "bg-accent text-accent-foreground")}
                            />
                          }
                        >
                          <HugeiconsIcon icon={meta.icon} strokeWidth={1.8} className="size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>{meta.label}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </fieldset>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="미리보기 초기화"
                        onClick={() => setPreviewKey((key) => key + 1)}
                      />
                    }
                  >
                    <HugeiconsIcon icon={ReloadIcon} strokeWidth={1.8} className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>미리보기 초기화</TooltipContent>
                </Tooltip>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyInstall}
              aria-label={copied ? "가져오기 경로 복사됨" : "가져오기 경로 복사"}
              title={installCommand}
              className="h-8 max-w-full gap-2 rounded-xl px-2.5 font-normal text-muted-foreground shadow-none"
            >
              <HugeiconsIcon icon={TerminalIcon} strokeWidth={1.8} className="size-3.5 shrink-0" />
              <span className="truncate font-mono text-xs">@workspace/ui/blocks/{installName}</span>
              <HugeiconsIcon
                icon={copied ? Tick02Icon : Copy01Icon}
                strokeWidth={1.8}
                className="size-3.5 shrink-0"
              />
            </Button>
          </div>
        </div>

        {view === "preview" ? (
          <div className="relative isolate min-h-0 flex-1 overflow-hidden bg-muted/40">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 [background-image:radial-gradient(color-mix(in_oklch,var(--border)_70%,transparent)_1px,transparent_1px)] [background-size:16px_16px] dark:[background-image:radial-gradient(color-mix(in_oklch,var(--border)_55%,transparent)_1px,transparent_1px)]"
            />

            <div ref={containerRef} className="relative z-10 flex h-full w-full">
              <div
                key={previewKey}
                data-slot="block-viewer-frame"
                className={cn(
                  "@container relative h-full min-w-0 overflow-auto bg-background [transform:translateZ(0)] md:max-w-[calc(100%-0.75rem)]",
                  widthPercent < MAX_WIDTH_PERCENT &&
                    "rounded-r-xl border-r border-border/70 shadow-xs",
                  isResizing && "select-none",
                )}
                style={{ width: `${widthPercent}%` }}
              >
                <BlockDemo slug={slug} />
              </div>

              <button
                type="button"
                aria-label={`미리보기 너비 조절, 현재 ${Math.round(widthPercent)}%`}
                onPointerDown={(event) => {
                  if (event.button !== 0) {
                    return;
                  }

                  const containerWidth = containerRef.current?.offsetWidth;
                  if (!containerWidth) {
                    return;
                  }

                  event.preventDefault();
                  resizeStateRef.current = {
                    startX: event.clientX,
                    startWidth: widthPercentRef.current,
                    containerWidth,
                  };
                  setIsResizing(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    nudgeWidth(-2);
                  } else if (event.key === "ArrowRight") {
                    event.preventDefault();
                    nudgeWidth(2);
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    setViewport("mobile");
                  } else if (event.key === "End") {
                    event.preventDefault();
                    setViewport("desktop");
                  }
                }}
                className={cn(
                  "relative z-20 hidden h-full w-3 shrink-0 cursor-col-resize touch-none items-center justify-center border-0 bg-transparent p-0 md:flex",
                  "after:h-8 after:w-1.5 after:rounded-full after:bg-border after:transition-[height,background-color] after:content-['']",
                  "hover:after:h-10 hover:after:bg-foreground/35 focus-visible:outline-none focus-visible:after:h-10 focus-visible:after:bg-ring",
                  isResizing && "after:h-10 after:bg-foreground/35",
                )}
              />

              <div className="min-w-0 flex-1" aria-hidden />
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <CodeBlock code={code} label={`${installName}.tsx`} joined />
          </div>
        )}

        <span className="sr-only" aria-live="polite">
          {copied ? "가져오기 경로를 클립보드에 복사했습니다." : ""}
        </span>
      </div>
    </TooltipProvider>
  );
}
