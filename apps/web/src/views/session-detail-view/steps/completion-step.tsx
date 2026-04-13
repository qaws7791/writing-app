import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

import type { CompletionContent } from "@/views/session-detail-view/types"

export function CompletionStep({ content }: { content: CompletionContent }) {
  return (
    <div className="flex flex-col items-center gap-8 pt-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-accent-soft">
        <HugeiconsIcon
          icon={Tick02Icon}
          size={40}
          color="currentColor"
          strokeWidth={2}
          className="text-accent"
        />
      </div>
      <h1 className="text-xl leading-snug font-semibold text-foreground">
        {content.congratsMessage}
      </h1>
      <div className="flex w-full flex-col gap-3 text-left">
        {content.summaryPoints.map((point, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl bg-surface-secondary px-4 py-3"
          >
            <HugeiconsIcon
              icon={Tick02Icon}
              size={18}
              color="currentColor"
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-accent"
            />
            <span className="text-sm leading-6 text-foreground">{point}</span>
          </div>
        ))}
      </div>
      {content.nextSessionPreview && (
        <div className="w-full rounded-2xl border border-separator/80 bg-surface p-5 text-left">
          <p className="mb-1 text-xs leading-5 font-semibold tracking-wide text-muted/80 uppercase">
            다음 세션 미리보기
          </p>
          <p className="text-base leading-6 font-semibold text-foreground">
            {content.nextSessionPreview.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {content.nextSessionPreview.teaser}
          </p>
        </div>
      )}
    </div>
  )
}
