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
      <h2 className="text-lg font-bold text-on-surface">{content.question}</h2>
      {content.context && (
        <p className="text-sm text-on-surface-low">{content.context}</p>
      )}
      <textarea
        value={text}
        onChange={(e) =>
          onStateChange({
            text: e.target.value,
            hasInput: e.target.value.length >= content.minLength,
          })
        }
        placeholder={content.placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-outline/20 bg-surface-container-low px-4 py-3 text-sm leading-relaxed text-on-surface placeholder:text-on-surface-lowest focus:border-primary focus:outline-none"
      />
      <div className="flex justify-end">
        <span className="text-xs text-on-surface-lowest">
          {text.length} / {content.maxLength}자
        </span>
      </div>
    </div>
  )
}
