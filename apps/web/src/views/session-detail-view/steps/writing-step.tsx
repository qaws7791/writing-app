import { TextField } from "@workspace/ui/components/text-field"
import { TextArea } from "@workspace/ui/components/textarea"

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
      <div className="bg-secondary-container rounded-2xl px-5 py-4">
        <p className="text-label-medium-em text-on-surface-low mb-2 uppercase">
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
        <div className="bg-surface-container flex items-center gap-2 rounded-lg px-3 py-2">
          <span className="text-label-medium text-on-surface-low">
            제한 시간: {Math.floor(content.timeLimitSeconds / 60)}분
          </span>
        </div>
      )}
      <TextField
        value={text}
        onChange={(value) =>
          onStateChange({
            text: value,
            hasInput: value.length >= content.minLength,
          })
        }
      >
        <TextArea placeholder="여기에 글을 써주세요..." rows={10} />
      </TextField>
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
