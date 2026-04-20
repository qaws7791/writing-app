import { cn } from "@workspace/ui/utils"
import type { HighlightStepContent } from "@workspace/core/modules/journeys"

import type {
  HighlightState,
  InteractiveStepProps,
} from "@/views/session-detail-view/types"

type Props = InteractiveStepProps<HighlightStepContent, HighlightState>

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

  const segments: Array<{ id: string; text: string; rangeId?: string }> = []
  let lastEnd = 0
  for (const r of sortedRanges) {
    if (r.startOffset > lastEnd) {
      segments.push({
        id: `plain-${lastEnd}-${r.startOffset}`,
        text: content.passage.slice(lastEnd, r.startOffset),
      })
    }
    segments.push({
      id: `range-${r.id}`,
      text: content.passage.slice(r.startOffset, r.endOffset),
      rangeId: r.id,
    })
    lastEnd = r.endOffset
  }
  if (lastEnd < content.passage.length) {
    segments.push({
      id: `plain-${lastEnd}-${content.passage.length}`,
      text: content.passage.slice(lastEnd),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base leading-6 font-semibold text-foreground">
        {content.instruction}
      </p>
      <div className="rounded-2xl bg-muted p-4 text-sm leading-6 text-foreground">
        {segments.map((seg) => {
          const rangeId = seg.rangeId
          if (!rangeId) {
            return <span key={seg.id}>{seg.text}</span>
          }

          const isSelected = selectedIds.includes(rangeId)
          const isCorrect = content.correctRangeIds.includes(rangeId)

          const cls = cn(
            "cursor-pointer rounded px-0.5 transition-all",
            !checked && isSelected && "bg-accent/50 text-foreground underline",
            !checked && !isSelected && "hover:bg-accent",
            checked &&
              isSelected &&
              isCorrect &&
              "bg-success-soft text-success-soft-foreground",
            checked &&
              isSelected &&
              !isCorrect &&
              "bg-danger-soft text-danger-soft-foreground line-through",
            checked &&
              !isSelected &&
              isCorrect &&
              "bg-success-soft/70 text-success-soft-foreground underline"
          )

          return (
            <span
              key={seg.id}
              role="button"
              tabIndex={checked ? -1 : 0}
              aria-pressed={isSelected}
              onClick={() => toggleRange(rangeId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggleRange(rangeId)
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
        <div className="flex flex-col gap-2 rounded-xl bg-muted p-4">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground/80">
            해설
          </p>
          {content.selectableRanges.map((r) => (
            <p key={r.id} className="text-sm leading-6 text-muted-foreground">
              <span
                className={cn(
                  "font-[500]",
                  content.correctRangeIds.includes(r.id)
                    ? "text-success-soft-foreground"
                    : "text-foreground"
                )}
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
