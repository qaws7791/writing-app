import type {
  FillInTheBlankContent,
  FillInTheBlankState,
  InteractiveStepProps,
} from "@/views/session-detail-view/types"

type Props = InteractiveStepProps<FillInTheBlankContent, FillInTheBlankState>

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

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base leading-6 font-semibold text-foreground">
        {content.instruction}
      </p>

      {/* 빈칸이 포함된 문장 */}
      <div className="rounded-2xl bg-surface-secondary p-4 text-sm leading-6 text-foreground">
        {parts.map((part, i) => {
          const match = part.match(/\{\{(.+)\}\}/)
          if (!match) return <span key={i}>{part}</span>

          const blankId = match[1]!
          const blank = content.blanks.find((b) => b.id === blankId)
          if (!blank) return <span key={i}>{part}</span>

          const selectedId = selections[blankId]
          const selectedOpt = blank.options.find((o) => o.id === selectedId)
          const isCorrect = selectedId === blank.correctOptionId

          let style =
            "border-b-2 border-dashed border-accent px-1 font-[500] text-accent"
          if (checked && selectedId) {
            style = isCorrect
              ? "border-b-2 border-success px-1 font-[500] text-success-soft-foreground"
              : "border-b-2 border-danger px-1 font-[500] text-danger-soft-foreground line-through"
          }

          return (
            <span key={i} className={style}>
              {selectedOpt ? selectedOpt.text : "______"}
            </span>
          )
        })}
      </div>

      {/* 빈칸별 선택지 */}
      {content.blanks.map((blank) => (
        <div key={blank.id} className="flex flex-col gap-2">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted/80">
            빈칸 선택
          </p>
          <div className="flex flex-wrap gap-2">
            {blank.options.map((opt) => {
              const isSelected = selections[blank.id] === opt.id
              const isCorrect = opt.id === blank.correctOptionId

              let cls =
                "rounded-lg border px-3 py-2 text-sm leading-6 transition-all"
              if (isSelected && !checked) {
                cls +=
                  " border-accent bg-accent-soft text-accent-soft-foreground font-[500]"
              } else if (checked && isSelected && isCorrect) {
                cls +=
                  " border-success bg-success-soft text-success-soft-foreground font-[500]"
              } else if (checked && isSelected && !isCorrect) {
                cls +=
                  " border-danger bg-danger-soft text-danger-soft-foreground line-through"
              } else if (checked && isCorrect) {
                cls +=
                  " border-success/50 bg-success-soft/60 text-success-soft-foreground"
              } else {
                cls += " border-separator bg-surface text-foreground"
              }

              return (
                <button
                  key={opt.id}
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
        <div className="rounded-xl bg-surface-secondary p-4">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted/80">
            해설
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {content.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
