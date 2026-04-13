import { TextField } from "@workspace/ui/components/text-field"
import { TextArea } from "@workspace/ui/components/textarea"

import type {
  ShortAnswerContent,
  InputStepState,
  InteractiveStepProps,
} from "@/views/session-detail-view/types"

type Props = InteractiveStepProps<ShortAnswerContent, InputStepState>

export function ShortAnswerStep({ content, state, onStateChange }: Props) {
  const text = state?.text ?? ""

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-title-medium-em text-on-surface">
        {content.question}
      </h2>
      {content.context && (
        <p className="text-body-medium text-on-surface-low">
          {content.context}
        </p>
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
        <TextArea placeholder={content.placeholder} rows={4} />
      </TextField>
      <div className="flex justify-end">
        <span className="text-label-medium text-on-surface-lowest">
          {text.length} / {content.maxLength}자
        </span>
      </div>
    </div>
  )
}
