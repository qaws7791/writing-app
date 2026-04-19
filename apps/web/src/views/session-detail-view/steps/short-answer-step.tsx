import { Textarea } from "@workspace/ui/components/ui/textarea"

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
      <h2 className="text-lg leading-7 font-semibold text-foreground">
        {content.question}
      </h2>
      {content.context && (
        <p className="text-sm leading-6 text-muted-foreground">
          {content.context}
        </p>
      )}
      <Textarea
        value={text}
        onChange={(e) =>
          onStateChange({
            text: e.target.value,
            hasInput: e.target.value.length >= content.minLength,
          })
        }
        placeholder={content.placeholder}
        rows={4}
      />
      <div className="flex justify-end">
        <span className="text-xs leading-5 font-medium text-muted-foreground/80">
          {text.length} / {content.maxLength}자
        </span>
      </div>
    </div>
  )
}
