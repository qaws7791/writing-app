import { Textarea } from "@workspace/ui/components/ui/textarea"

import type {
  WritingContent,
  InputStepState,
  InteractiveStepProps,
} from "@/views/session-detail-view/types"

type Props = InteractiveStepProps<WritingContent, InputStepState>

export function WritingStep({ content, state, onStateChange }: Props) {
  const text = state?.text ?? ""

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-accent/50 px-5 py-4">
        <p className="mb-2 text-xs leading-5 font-semibold tracking-wide text-muted-foreground uppercase">
          글쓰기 주제
        </p>
        <p className="text-base leading-7 font-medium text-foreground">
          {content.prompt}
        </p>
      </div>
      {content.guideline && (
        <p className="text-sm leading-6 text-muted-foreground">
          {content.guideline}
        </p>
      )}
      {content.timeLimitSeconds > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <span className="text-xs leading-5 font-medium text-muted-foreground">
            제한 시간: {Math.floor(content.timeLimitSeconds / 60)}분
          </span>
        </div>
      )}
      <Textarea
        value={text}
        onChange={(e) =>
          onStateChange({
            text: e.target.value,
            hasInput: e.target.value.length >= content.minLength,
          })
        }
        placeholder="여기에 글을 써주세요..."
        rows={10}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs leading-5 font-medium text-muted-foreground/80">
          최소 {content.minLength}자
        </span>
        <span
          className={`text-xs leading-5 font-medium ${
            text.length >= content.minLength
              ? "text-muted-foreground"
              : "text-muted-foreground/80"
          }`}
        >
          {text.length} / {content.recommendedLength}자 (권장)
        </span>
      </div>
    </div>
  )
}
