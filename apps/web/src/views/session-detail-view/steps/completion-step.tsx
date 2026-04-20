import { Check } from "lucide-react"
import type { CompletionStepContent } from "@workspace/core/modules/journeys"

export function CompletionStep({
  content,
}: {
  content: CompletionStepContent
}) {
  return (
    <div className="flex flex-col items-center gap-8 pt-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-accent/50">
        <Check size={40} strokeWidth={2} className="text-accent" />
      </div>
      <h1 className="text-xl leading-snug font-semibold text-foreground">
        {content.congratsMessage}
      </h1>
      <div className="flex w-full flex-col gap-3 text-left">
        {content.summaryPoints.map((point) => (
          <div
            key={point}
            className="flex items-start gap-3 rounded-xl bg-muted px-4 py-3"
          >
            <Check
              size={18}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-accent"
            />
            <span className="text-sm leading-6 text-foreground">{point}</span>
          </div>
        ))}
      </div>
      {content.nextSessionPreview && (
        <div className="w-full rounded-2xl border border-border/80 bg-background p-5 text-left">
          <p className="mb-1 text-xs leading-5 font-semibold tracking-wide text-muted-foreground/80 uppercase">
            다음 세션 미리보기
          </p>
          <p className="text-base leading-6 font-semibold text-foreground">
            {content.nextSessionPreview.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {content.nextSessionPreview.teaser}
          </p>
        </div>
      )}
    </div>
  )
}
