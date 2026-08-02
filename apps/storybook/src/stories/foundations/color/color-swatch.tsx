import { Check, Copy } from "lucide-react"
import * as React from "react"

import {
  copyToClipboard,
  getResolvedHex,
  pickForegroundOn,
} from "./color-utils"
import type { SemanticToken } from "./token-data"
import { useThemeRevision } from "./use-theme-revision"

type ColorSwatchProps = {
  token: SemanticToken
}

export function ColorSwatch({ token }: ColorSwatchProps) {
  const themeRevision = useThemeRevision()
  const [copied, setCopied] = React.useState(false)
  const liveRegionId = React.useId()

  void themeRevision
  const hex = getResolvedHex(token.cssVar)
  const swatchForeground =
    token.kind === "text" ? "var(--fg-default)" : pickForegroundOn(token.cssVar)

  const swatchBackground =
    token.kind === "text" ? "var(--bg-canvas)" : `var(${token.cssVar})`

  async function handleCopy() {
    const copiedValue = await copyToClipboard(token.token)

    if (!copiedValue) return

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <article className="grid overflow-hidden rounded-card border border-border/50">
      <div
        className="grid min-h-32 content-between p-5"
        style={{
          background: swatchBackground,
          color: swatchForeground,
        }}
      >
        <span className="text-label-sm font-black">{token.label}</span>
        {token.kind === "text" ? (
          <p
            className="text-title-lg font-black"
            style={{ color: `var(${token.cssVar})` }}
          >
            가나다 ABC 123
          </p>
        ) : (
          <span className="text-body-sm font-semibold opacity-80">Aa</span>
        )}
      </div>

      <div className="grid gap-3 border-t border-border/50 bg-bg-elevated p-4 text-fg-default">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="font-mono text-label-sm font-bold text-fg-muted">
              {token.token}
            </p>
            <p className="font-mono text-caption font-medium text-fg-muted">
              {hex ?? "—"}
            </p>
          </div>
          <button
            aria-describedby={liveRegionId}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-border/60 bg-bg-surface px-3 py-1.5 text-label-sm font-bold text-fg-default transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={() => void handleCopy()}
            type="button"
          >
            {copied ? (
              <Check aria-hidden className="size-3.5" />
            ) : (
              <Copy aria-hidden className="size-3.5" />
            )}
            복사
          </button>
        </div>
        <p className="text-body-sm font-medium text-fg-muted">{token.usage}</p>
        <p className="sr-only" id={liveRegionId} role="status">
          {copied ? `${token.token} 토큰을 복사했습니다.` : ""}
        </p>
      </div>
    </article>
  )
}
