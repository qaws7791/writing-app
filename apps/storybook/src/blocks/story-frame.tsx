import type { ReactNode } from "react"

type StoryFrameVariant =
  | "centered"
  | "fullscreen"
  | "inverse"
  | "padded"
  | "reading"

const frameClassName: Record<StoryFrameVariant, string> = {
  centered:
    "grid min-h-64 place-items-center rounded-panel border border-border-subtle bg-bg-canvas p-surface-padding-md",
  fullscreen: "min-h-dvh bg-bg-canvas p-surface-padding-md",
  inverse: "rounded-panel bg-bg-inverse p-surface-padding-md text-fg-inverse",
  padded:
    "rounded-panel border border-border-subtle bg-bg-canvas p-surface-padding-md",
  reading:
    "mx-auto grid max-w-3xl gap-5 rounded-panel border border-border-subtle bg-bg-canvas p-surface-padding-lg",
}

function StoryFrame({
  children,
  variant = "padded",
}: {
  readonly children: ReactNode
  readonly variant?: StoryFrameVariant
}) {
  return <div className={frameClassName[variant]}>{children}</div>
}

export { StoryFrame }
