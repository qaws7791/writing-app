import * as React from "react"

import {
  formatContrastRatio,
  getContrastResult,
  wcagLabel,
  wcagPasses,
} from "./color-utils"
import type { ContrastPair } from "./token-data"
import { useThemeRevision } from "./use-theme-revision"

type ContrastPairCardProps = {
  pair: ContrastPair
}

function WcagBadge({
  label,
  level,
}: {
  label: string
  level: ReturnType<typeof getContrastResult> extends infer T
    ? T extends { levelLarge: infer L }
      ? L
      : never
    : never
}) {
  const passes = wcagPasses(level)

  return (
    <span
      className={
        passes
          ? "rounded-control bg-success-bg px-2 py-1 text-caption font-bold text-success-fg"
          : "rounded-control bg-danger-bg px-2 py-1 text-caption font-bold text-danger-fg"
      }
    >
      {label}: {wcagLabel(level)}
    </span>
  )
}

export function ContrastPairCard({ pair }: ContrastPairCardProps) {
  const themeRevision = useThemeRevision()

  void themeRevision
  const contrast = getContrastResult(
    pair.foregroundCssVar,
    pair.backgroundCssVar
  )

  return (
    <article className="grid gap-4 rounded-panel border border-border/50 bg-bg-surface p-surface-padding-md">
      <header className="grid gap-1">
        <h3 className="text-title-md font-black text-fg-default">
          {pair.label}
        </h3>
        <p className="text-body-sm font-medium text-fg-muted">{pair.usage}</p>
        <p className="font-mono text-caption font-bold text-fg-muted">
          {pair.role}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
        <div
          className="grid gap-3 rounded-panel border border-border/40 p-5"
          style={{
            background: `var(${pair.backgroundCssVar})`,
            color: `var(${pair.foregroundCssVar})`,
          }}
        >
          <span className="text-label-sm font-black">미리보기</span>
          <strong className="text-title-md font-black">{pair.label}</strong>
          <p className="text-body-sm font-semibold">
            전경과 배경을 함께 쓰는 semantic pair다.
          </p>
          <span className="inline-flex w-fit rounded-control border border-current/20 px-3 py-1.5 text-label-sm font-bold">
            샘플 버튼
          </span>
        </div>

        <div className="grid content-start gap-2 rounded-panel border border-border/50 bg-bg-elevated p-4 text-fg-default">
          <p className="text-label-sm font-black text-fg-muted">대비</p>
          <p className="font-mono text-title-md font-black">
            {contrast ? formatContrastRatio(contrast.ratio) : "—"}
          </p>
          {contrast ? (
            <div className="flex flex-wrap gap-2">
              <WcagBadge label="일반" level={contrast.levelNormal} />
              <WcagBadge label="큰 텍스트" level={contrast.levelLarge} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
