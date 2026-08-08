import * as React from "react";

import { CheckIcon as Check, CopyIcon as Copy } from "@workspace/ui/components/icons";

import { copyToClipboard, getResolvedHex, pickForegroundOn } from "./color-utils";
import type { SemanticToken } from "./token-data";
import { useThemeRevision } from "./use-theme-revision";

type ColorSwatchProps = {
  token: SemanticToken;
};

export function ColorSwatch({ token }: ColorSwatchProps) {
  const themeRevision = useThemeRevision();
  const [copied, setCopied] = React.useState(false);
  const liveRegionId = React.useId();

  void themeRevision;
  const hex = getResolvedHex(token.cssVar);
  const swatchForeground =
    token.kind === "text" ? "var(--foreground)" : pickForegroundOn(token.cssVar);

  const swatchBackground = token.kind === "text" ? "var(--background)" : `var(${token.cssVar})`;

  async function handleCopy() {
    const copiedValue = await copyToClipboard(token.token);

    if (!copiedValue) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="grid overflow-hidden rounded-4xl border border-border/80 bg-card shadow-xs">
      <div
        className="grid min-h-32 content-between p-5"
        style={{
          background: swatchBackground,
          color: swatchForeground,
        }}
      >
        <span className="text-sm font-semibold">{token.label}</span>
        {token.kind === "text" ? (
          <p className="text-lg font-semibold" style={{ color: `var(${token.cssVar})` }}>
            가나다 ABC 123
          </p>
        ) : (
          <span className="text-sm font-medium opacity-80">Aa</span>
        )}
      </div>

      <div className="grid gap-3 border-t border-border/80 bg-card p-4 text-foreground">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="font-mono text-sm font-semibold text-muted-foreground">{token.token}</p>
            <p className="font-mono text-xs font-medium text-muted-foreground">{hex ?? "—"}</p>
          </div>
          <button
            aria-describedby={liveRegionId}
            className="squircle inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
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
        <p className="text-sm font-normal text-muted-foreground">{token.usage}</p>
        <output className="sr-only" id={liveRegionId}>
          {copied ? `${token.token} 토큰을 복사했습니다.` : ""}
        </output>
      </div>
    </article>
  );
}
