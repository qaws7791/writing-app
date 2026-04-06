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
      <p className="text-base font-semibold text-on-surface">
        {content.instruction}
      </p>

      {/* 빈칸이 포함된 문장 */}
      <div className="rounded-2xl bg-surface-container p-4 text-sm leading-loose text-on-surface">
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
            "border-b-2 border-dashed border-primary px-1 font-medium text-primary"
          if (checked && selectedId) {
            style = isCorrect
              ? "border-b-2 border-green-500 px-1 font-medium text-green-600 dark:text-green-400"
              : "border-b-2 border-red-500 px-1 font-medium text-red-600 dark:text-red-400 line-through"
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
          <p className="text-xs font-semibold text-on-surface-lowest">
            빈칸 선택
          </p>
          <div className="flex flex-wrap gap-2">
            {blank.options.map((opt) => {
              const isSelected = selections[blank.id] === opt.id
              const isCorrect = opt.id === blank.correctOptionId

              let cls = "rounded-lg border px-3 py-2 text-sm transition-all"
              if (isSelected && !checked) {
                cls += " border-primary bg-primary/10 text-primary font-medium"
              } else if (checked && isSelected && isCorrect) {
                cls +=
                  " border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 font-medium"
              } else if (checked && isSelected && !isCorrect) {
                cls +=
                  " border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 line-through"
              } else if (checked && isCorrect) {
                cls +=
                  " border-green-500/50 bg-green-50/50 text-green-600 dark:bg-green-500/5 dark:text-green-400"
              } else {
                cls +=
                  " border-outline/20 bg-surface-container-low text-on-surface"
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
        <div className="rounded-xl bg-surface-container p-4">
          <p className="text-xs font-semibold text-on-surface-lowest">해설</p>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-low">
            {content.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
