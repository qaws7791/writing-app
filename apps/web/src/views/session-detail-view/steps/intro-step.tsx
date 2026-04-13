import { Chip } from "@workspace/ui/components/chip"

import type { IntroContent } from "@/views/session-detail-view/types"

export function IntroStep({ content }: { content: IntroContent }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs leading-5 font-semibold tracking-wide text-accent uppercase">
          세션 시작
        </p>
        <h1 className="text-xl leading-snug font-semibold text-foreground">
          {content.title}
        </h1>
      </div>
      <p className="text-base leading-7 text-muted">{content.description}</p>
      {content.keywords && content.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.keywords.map((kw) => (
            <Chip key={kw} variant="secondary" size="md">
              {kw}
            </Chip>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-3">
        <span className="text-sm leading-6 text-muted">예상 소요 시간</span>
        <span className="text-sm leading-5 font-medium text-foreground">
          {content.estimatedMinutes}분
        </span>
      </div>
    </div>
  )
}
