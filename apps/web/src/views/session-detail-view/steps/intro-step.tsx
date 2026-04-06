import type { IntroContent } from "@/views/session-detail-view/types"

export function IntroStep({ content }: { content: IntroContent }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          세션 시작
        </p>
        <h1 className="text-2xl leading-tight font-bold tracking-tight text-on-surface">
          {content.title}
        </h1>
      </div>
      <p className="text-base leading-relaxed text-on-surface-low">
        {content.description}
      </p>
      {content.keywords && content.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.keywords.map((kw) => (
            <span
              key={kw}
              className="rounded-lg bg-secondary-container px-3 py-1.5 text-sm font-medium text-on-secondary-container"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-3">
        <span className="text-sm text-on-surface-low">예상 소요 시간</span>
        <span className="text-sm font-semibold text-on-surface">
          {content.estimatedMinutes}분
        </span>
      </div>
    </div>
  )
}
