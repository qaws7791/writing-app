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
      <div className="rounded-2xl bg-secondary-container px-5 py-4">
        <p className="mb-2 text-label-medium-em text-on-surface-low uppercase">
          글쓰기 주제
        </p>
        <p className="text-body-large-em text-on-surface">{content.prompt}</p>
      </div>
      {content.guideline && (
        <p className="text-body-medium text-on-surface-low">
          {content.guideline}
        </p>
      )}
      {content.timeLimitSeconds > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2">
          <span className="text-label-medium text-on-surface-low">
            제한 시간: {Math.floor(content.timeLimitSeconds / 60)}분
          </span>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) =>
          onStateChange({
            text: e.target.value,
            hasInput: e.target.value.length >= content.minLength,
          })
        }
        placeholder="여기에 글을 써주세요..."
        rows={10}
        className="w-full resize-none rounded-xl border border-outline/20 bg-surface-container-low px-4 py-3 text-body-medium text-on-surface placeholder:text-on-surface-lowest focus:border-primary focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-label-medium text-on-surface-lowest">
          최소 {content.minLength}자
        </span>
        <span
          className={`text-label-medium ${
            text.length >= content.minLength
              ? "text-on-surface-low"
              : "text-on-surface-lowest"
          }`}
        >
          {text.length} / {content.recommendedLength}자 (권장)
        </span>
      </div>
    </div>
  )
}
