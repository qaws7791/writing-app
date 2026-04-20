import { cn } from "@workspace/ui/utils"
import type { FillInTheBlankStepContent } from "@workspace/core/modules/journeys"

import type {
  FillInTheBlankState,
  InteractiveStepProps,
} from "@/views/session-detail-view/types"

type Props = InteractiveStepProps<
  FillInTheBlankStepContent,
  FillInTheBlankState
>

function createSentencePartKeys(sentence: string): string[] {
  const parts = sentence.split(/(\{\{[^}]+\}\})/)
  let cursor = 0

  return parts.map((part) => {
    const key = `part-${cursor}`
    cursor += part.length
    return key
  })
}

export function FillInTheBlankStep({ content, state, onStateChange }: Props) {
  const selections = state?.selections ?? {}
  const checked = state?.checked === true

  function selectOption(blankId: string, optionId: string) {
    if (checked) return
    const next = { ...selections, [blankId]: optionId }
    const allFilled = content.blanks.every((b) => next[b.id])
    onStateChange({
      selections: next,
      hasSelection: allFilled,
      checked: false,
    })
  }

  const parts = content.sentence.split(/(\{\{[^}]+\}\})/)
  const partKeys = createSentencePartKeys(content.sentence)

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base leading-6 font-semibold text-foreground">
        {content.instruction}
      </p>

      <div className="rounded-2xl bg-muted p-4 text-sm leading-6 text-foreground">
        {parts.map((part, index) => {
          const partKey = partKeys[index] ?? part
          const match = part.match(/\{\{(.+)\}\}/)
          if (!match) return <span key={partKey}>{part}</span>

          const [, blankId] = match
          if (!blankId) return <span key={partKey}>{part}</span>

          const blank = content.blanks.find((b) => b.id === blankId)
          if (!blank) return <span key={partKey}>{part}</span>

          const selectedId = selections[blankId]
          const selectedOpt = blank.options.find((o) => o.id === selectedId)
          const isCorrect = selectedId === blank.correctOptionId

          const style = cn(
            "border-b-2 border-dashed px-1 font-[500]",
            checked && selectedId
              ? isCorrect
                ? "border-success text-success-soft-foreground"
                : "border-danger text-danger-soft-foreground line-through"
              : "border-accent text-accent"
          )

          return (
            <span key={partKey} className={style}>
              {selectedOpt ? selectedOpt.text : "______"}
            </span>
          )
        })}
      </div>

      {content.blanks.map((blank) => (
        <div key={blank.id} className="flex flex-col gap-2">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground/80">
            빈칸 선택
          </p>
          <div className="flex flex-wrap gap-2">
            {blank.options.map((opt) => {
              const isSelected = selections[blank.id] === opt.id
              const isCorrect = opt.id === blank.correctOptionId

              const cls = cn(
                "rounded-lg border px-3 py-2 text-sm leading-6 transition-all",
                isSelected &&
                  !checked &&
                  "border-accent bg-accent/50 font-[500] text-foreground",
                checked &&
                  isSelected &&
                  isCorrect &&
                  "border-success bg-success-soft text-success-soft-foreground font-[500]",
                checked &&
                  isSelected &&
                  !isCorrect &&
                  "border-danger bg-danger-soft text-danger-soft-foreground line-through",
                checked &&
                  !isSelected &&
                  isCorrect &&
                  "border-success/50 bg-success-soft/60 text-success-soft-foreground",
                !isSelected &&
                  (!checked || !isCorrect) &&
                  "border-border bg-background text-foreground"
              )

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectOption(blank.id, opt.id)}
                  disabled={checked}
                  className={cls}
                >
                  {opt.text}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {checked && (
        <div className="rounded-xl bg-muted p-4">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground/80">
            해설
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {content.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
