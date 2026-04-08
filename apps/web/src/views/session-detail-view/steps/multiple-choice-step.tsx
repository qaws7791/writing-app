import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

import type {
  MultipleChoiceContent,
  MultipleChoiceState,
  InteractiveStepProps,
} from "@/views/session-detail-view/types"

type Props = InteractiveStepProps<MultipleChoiceContent, MultipleChoiceState>

export function MultipleChoiceStep({ content, state, onStateChange }: Props) {
  const selected = state?.selected ?? []
  const checked = state?.checked === true

  function toggleOption(id: string) {
    if (checked) return
    let next: string[]
    if (content.multiSelect) {
      next = selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    } else {
      next = [id]
    }
    onStateChange({
      selected: next,
      hasSelection: next.length > 0,
      checked: false,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-on-surface">{content.question}</h2>
      {content.passage && (
        <p className="rounded-xl bg-surface-container p-4 text-sm leading-relaxed text-on-surface">
          {content.passage}
        </p>
      )}
      {content.multiSelect && !checked && (
        <p className="text-xs text-on-surface-lowest">복수 선택 가능</p>
      )}
      <div className="flex flex-col gap-2.5">
        {content.options.map((opt) => {
          const isSelected = selected.includes(opt.id)
          const isCorrect = content.correctOptionIds?.includes(opt.id) ?? false

          let borderClass = "border-outline/20"
          let bgClass = "bg-surface-container-low"
          if (isSelected && !checked) {
            borderClass = "border-primary"
            bgClass = "bg-primary/5"
          }
          if (checked && isSelected && isCorrect) {
            borderClass = "border-green-500"
            bgClass = "bg-green-50 dark:bg-green-500/10"
          }
          if (checked && isSelected && !isCorrect) {
            borderClass = "border-red-500"
            bgClass = "bg-red-50 dark:bg-red-500/10"
          }
          if (checked && !isSelected && isCorrect) {
            borderClass = "border-green-500/50"
            bgClass = "bg-green-50/50 dark:bg-green-500/5"
          }

          return (
            <button
              key={opt.id}
              onClick={() => toggleOption(opt.id)}
              disabled={checked}
              className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${borderClass} ${bgClass}`}
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-current text-on-surface-lowest">
                {isSelected && (
                  <span className="size-2.5 rounded-full bg-current" />
                )}
              </span>
              <span className="flex-1 text-sm text-on-surface">{opt.text}</span>
              {checked && isCorrect && (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={18}
                  color="rgb(34 197 94)"
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                />
              )}
              {checked && isSelected && !isCorrect && (
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={18}
                  color="rgb(239 68 68)"
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                />
              )}
            </button>
          )
        })}
      </div>
      {checked && (
        <div className="flex flex-col gap-2 rounded-xl bg-surface-container p-4">
          <p className="text-xs font-semibold text-on-surface-lowest">해설</p>
          {content.options.map((opt) => (
            <p
              key={opt.id}
              className="text-sm leading-relaxed text-on-surface-low"
            >
              <span className="font-medium text-on-surface">
                {opt.text.slice(0, 1)}:
              </span>{" "}
              {content.explanations?.[opt.id]}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
