import { Chip } from "@workspace/ui/components/chip"

import type { IntroContent } from "@/views/session-detail-view/types"

export function IntroStep({ content }: { content: IntroContent }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-label-medium-em text-primary uppercase">세션 시작</p>
        <h1 className="text-headline-small-em text-on-surface">
          {content.title}
        </h1>
      </div>
      <p className="text-body-large text-on-surface-low">
        {content.description}
      </p>
      {content.keywords && content.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.keywords.map((kw) => (
            <Chip key={kw} variant="secondary" size="md">
              {kw}
            </Chip>
          ))}
        </div>
      )}
      <div className="bg-surface-container flex items-center gap-2 rounded-xl px-4 py-3">
        <span className="text-body-medium text-on-surface-low">
          예상 소요 시간
        </span>
        <span className="text-label-large-em text-on-surface">
          {content.estimatedMinutes}분
        </span>
      </div>
    </div>
  )
}
