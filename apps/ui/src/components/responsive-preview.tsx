"use client";

import { useMemo, useState } from "react";

const VIEWPORTS = [
  { id: "mobile-sm", label: "Mobile S · 360×800", width: 360, height: 800 },
  { id: "mobile-lg", label: "Mobile L · 430×932", width: 430, height: 932 },
  { id: "tablet", label: "Tablet · 834×1112", width: 834, height: 1112 },
  { id: "desktop", label: "Desktop · 1280×900", width: 1280, height: 900 },
  { id: "wide", label: "Wide · 1440×1000", width: 1440, height: 1000 },
] as const;

type Theme = "system" | "light" | "dark";
type Motion = "full" | "reduced";

type ResponsivePreviewProps = {
  src: string;
  title: string;
};

function applyDocumentMode(theme: Theme, motion: Motion) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.motion = motion;
}

export default function ResponsivePreview({ src, title }: ResponsivePreviewProps) {
  const [theme, setTheme] = useState<Theme>("system");
  const [motion, setMotion] = useState<Motion>("full");
  const [viewportId, setViewportId] = useState<(typeof VIEWPORTS)[number]["id"]>("mobile-lg");
  const viewport = VIEWPORTS.find((candidate) => candidate.id === viewportId) ?? VIEWPORTS[1];
  const previewSrc = useMemo(() => {
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}theme=${theme}&motion=${motion}`;
  }, [motion, src, theme]);

  return (
    <div className="overflow-hidden rounded-4xl border bg-muted/25">
      <div className="flex flex-wrap items-end gap-3 border-b bg-background p-3">
        <label className="grid gap-1 text-xs text-muted-foreground">
          테마
          <select
            aria-label="미리보기 테마"
            value={theme}
            onChange={(event) => {
              const next = event.target.value as Theme;
              setTheme(next);
              applyDocumentMode(next, motion);
            }}
            className="h-9 rounded-xl border bg-background px-3 text-sm text-foreground"
          >
            <option value="system">시스템</option>
            <option value="light">라이트</option>
            <option value="dark">다크</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          모션
          <select
            aria-label="미리보기 모션"
            value={motion}
            onChange={(event) => {
              const next = event.target.value as Motion;
              setMotion(next);
              applyDocumentMode(theme, next);
            }}
            className="h-9 rounded-xl border bg-background px-3 text-sm text-foreground"
          >
            <option value="full">전체</option>
            <option value="reduced">줄임</option>
          </select>
        </label>
        <label className="grid min-w-52 gap-1 text-xs text-muted-foreground">
          뷰포트
          <select
            aria-label="미리보기 뷰포트"
            value={viewportId}
            onChange={(event) => setViewportId(event.target.value as typeof viewportId)}
            className="h-9 rounded-xl border bg-background px-3 text-sm text-foreground"
          >
            {VIEWPORTS.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
        </label>
        <a
          href={previewSrc}
          target="_blank"
          rel="noreferrer"
          className="ml-auto rounded-xl border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
        >
          새 창에서 열기 ↗
        </a>
      </div>
      <div
        className="max-h-[46rem] overflow-auto p-4"
        aria-label={`${viewport.width}×${viewport.height} CSS px 미리보기 영역`}
      >
        <iframe
          key={previewSrc}
          src={previewSrc}
          title={title}
          sandbox="allow-scripts"
          width={viewport.width}
          height={viewport.height}
          className="mx-auto block max-w-none border bg-background shadow-sm"
        />
      </div>
    </div>
  );
}
