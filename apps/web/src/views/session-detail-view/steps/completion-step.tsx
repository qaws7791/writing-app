import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

import type { CompletionContent } from "@/views/session-detail-view/types"

export function CompletionStep({ content }: { content: CompletionContent }) {
  return (
    <div className="flex flex-col items-center gap-8 pt-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
        <HugeiconsIcon
          icon={Tick02Icon}
          size={40}
          color="var(--color-primary)"
          strokeWidth={2}
        />
      </div>
      <h1 className="text-2xl font-bold text-on-surface">
        {content.congratsMessage}
      </h1>
      <div className="flex w-full flex-col gap-3 text-left">
        {content.summaryPoints.map((point, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl bg-surface-container px-4 py-3"
          >
            <HugeiconsIcon
              icon={Tick02Icon}
              size={18}
              color="var(--color-primary)"
              strokeWidth={2}
              className="mt-0.5 shrink-0"
            />
            <span className="text-sm text-on-surface">{point}</span>
          </div>
        ))}
      </div>
      {content.nextSessionPreview && (
        <div className="w-full rounded-2xl border border-outline/10 bg-surface-container-low p-5 text-left">
          <p className="mb-1 text-xs font-semibold tracking-widest text-on-surface-lowest uppercase">
            다음 세션 미리보기
          </p>
          <p className="text-base font-semibold text-on-surface">
            {content.nextSessionPreview.title}
          </p>
          <p className="mt-1 text-sm text-on-surface-low">
            {content.nextSessionPreview.teaser}
          </p>
        </div>
      )}
    </div>
  )
}
