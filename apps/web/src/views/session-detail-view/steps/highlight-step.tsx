import type {
  HighlightContent,
  HighlightState,
  InteractiveStepProps,
} from "@/views/session-detail-view/types"

type Props = InteractiveStepProps<HighlightContent, HighlightState>

export function HighlightStep({ content, state, onStateChange }: Props) {
  const selectedIds = state?.selected ?? []
  const checked = state?.checked === true

  function toggleRange(id: string) {
    if (checked) return
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id]
    onStateChange({
      selected: next,
      hasSelection: next.length > 0,
      checked: false,
    })
  }

  const sortedRanges = [...content.selectableRanges].sort(
    (a, b) => a.startOffset - b.startOffset
  )

  const segments: Array<{ text: string; rangeId?: string }> = []
  let lastEnd = 0
  for (const r of sortedRanges) {
    if (r.startOffset > lastEnd) {
      segments.push({ text: content.passage.slice(lastEnd, r.startOffset) })
    }
    segments.push({
      text: content.passage.slice(r.startOffset, r.endOffset),
      rangeId: r.id,
    })
    lastEnd = r.endOffset
  }
  if (lastEnd < content.passage.length) {
    segments.push({ text: content.passage.slice(lastEnd) })
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-title-small-em text-on-surface">
        {content.instruction}
      </p>
      <div className="rounded-2xl bg-surface-container p-4 text-body-medium text-on-surface">
        {segments.map((seg, i) => {
          if (!seg.rangeId) {
            return <span key={i}>{seg.text}</span>
          }

          const isSelected = selectedIds.includes(seg.rangeId)
          const isCorrect = content.correctRangeIds.includes(seg.rangeId)

          let cls = "cursor-pointer rounded px-0.5 transition-all"
          if (!checked) {
            cls += isSelected
              ? " bg-primary/20 text-primary underline"
              : " hover:bg-surface-container-high"
          } else {
            if (isSelected && isCorrect) {
              cls +=
                " bg-green-200 dark:bg-green-500/20 text-green-800 dark:text-green-300"
            } else if (isSelected && !isCorrect) {
              cls +=
                " bg-red-200 dark:bg-red-500/20 text-red-800 dark:text-red-300 line-through"
            } else if (isCorrect) {
              cls +=
                " bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 underline"
            }
          }

          return (
            <span
              key={i}
              role="button"
              tabIndex={checked ? -1 : 0}
              aria-pressed={isSelected}
              onClick={() => toggleRange(seg.rangeId!)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggleRange(seg.rangeId!)
                }
              }}
              className={cls}
            >
              {seg.text}
            </span>
          )
        })}
      </div>
      {checked && (
        <div className="flex flex-col gap-2 rounded-xl bg-surface-container p-4">
          <p className="text-label-medium-em text-on-surface-lowest">해설</p>
          {content.selectableRanges.map((r) => (
            <p key={r.id} className="text-body-medium text-on-surface-low">
              <span
                className={`font-medium ${
                  content.correctRangeIds.includes(r.id)
                    ? "text-green-600 dark:text-green-400"
                    : "text-on-surface"
                }`}
              >
                &quot;{content.passage.slice(r.startOffset, r.endOffset)}&quot;
              </span>{" "}
              — {content.explanations[r.id]}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
