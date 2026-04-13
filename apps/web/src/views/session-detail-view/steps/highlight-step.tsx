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
      <p className="text-base leading-6 font-semibold text-foreground">
        {content.instruction}
      </p>
      <div className="rounded-2xl bg-surface-secondary p-4 text-sm leading-6 text-foreground">
        {segments.map((seg, i) => {
          if (!seg.rangeId) {
            return <span key={i}>{seg.text}</span>
          }

          const isSelected = selectedIds.includes(seg.rangeId)
          const isCorrect = content.correctRangeIds.includes(seg.rangeId)

          let cls = "cursor-pointer rounded px-0.5 transition-all"
          if (!checked) {
            cls += isSelected
              ? " bg-accent-soft text-accent-soft-foreground underline"
              : " hover:bg-surface-tertiary"
          } else {
            if (isSelected && isCorrect) {
              cls += " bg-success-soft text-success-soft-foreground"
            } else if (isSelected && !isCorrect) {
              cls += " bg-danger-soft text-danger-soft-foreground line-through"
            } else if (isCorrect) {
              cls +=
                " bg-success-soft/70 text-success-soft-foreground underline"
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
        <div className="flex flex-col gap-2 rounded-xl bg-surface-secondary p-4">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted/80">
            해설
          </p>
          {content.selectableRanges.map((r) => (
            <p key={r.id} className="text-sm leading-6 text-muted">
              <span
                className={`font-[500] ${
                  content.correctRangeIds.includes(r.id)
                    ? "text-success-soft-foreground"
                    : "text-foreground"
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
