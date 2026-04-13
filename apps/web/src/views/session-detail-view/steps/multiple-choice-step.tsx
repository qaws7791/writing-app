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
      <h2 className="text-lg leading-7 font-semibold text-foreground">
        {content.question}
      </h2>
      {content.passage && (
        <p className="rounded-xl bg-surface-secondary p-4 text-sm leading-6 text-foreground">
          {content.passage}
        </p>
      )}
      {content.multiSelect && !checked && (
        <p className="text-xs leading-5 font-medium text-muted/80">
          복수 선택 가능
        </p>
      )}
      <div className="flex flex-col gap-2.5">
        {content.options.map((opt) => {
          const isSelected = selected.includes(opt.id)
          const isCorrect = content.correctOptionIds?.includes(opt.id) ?? false

          let borderClass = "border-separator"
          let bgClass = "bg-surface"
          if (isSelected && !checked) {
            borderClass = "border-accent"
            bgClass = "bg-accent-soft"
          }
          if (checked && isSelected && isCorrect) {
            borderClass = "border-success"
            bgClass = "bg-success-soft"
          }
          if (checked && isSelected && !isCorrect) {
            borderClass = "border-danger"
            bgClass = "bg-danger-soft"
          }
          if (checked && !isSelected && isCorrect) {
            borderClass = "border-success/50"
            bgClass = "bg-success-soft/60"
          }

          return (
            <button
              key={opt.id}
              onClick={() => toggleOption(opt.id)}
              disabled={checked}
              className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${borderClass} ${bgClass}`}
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-current text-muted/80">
                {isSelected && (
                  <span className="size-2.5 rounded-full bg-current" />
                )}
              </span>
              <span className="flex-1 text-sm leading-6 text-foreground">
                {opt.text}
              </span>
              {checked && isCorrect && (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-success"
                />
              )}
              {checked && isSelected && !isCorrect && (
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-danger"
                />
              )}
            </button>
          )
        })}
      </div>
      {checked && (
        <div className="flex flex-col gap-2 rounded-xl bg-surface-secondary p-4">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted/80">
            해설
          </p>
          {content.options.map((opt) => (
            <p key={opt.id} className="text-sm leading-6 text-muted">
              <span className="font-[500] text-foreground">
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
