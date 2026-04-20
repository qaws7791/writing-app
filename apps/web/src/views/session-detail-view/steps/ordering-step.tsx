import { ChevronUp, ChevronDown, Check, X } from "lucide-react"
import type { OrderingStepContent } from "@workspace/core/modules/journeys"
import { Button } from "@workspace/ui/components/ui/button"

import type {
  OrderingState,
  InteractiveStepProps,
} from "@/views/session-detail-view/types"

type Props = InteractiveStepProps<OrderingStepContent, OrderingState>

export function OrderingStep({ content, state, onStateChange }: Props) {
  const checked = state?.checked === true
  const currentOrder = state?.order ?? content.items.map((item) => item.id)

  function moveItem(index: number, direction: "up" | "down") {
    if (checked) return
    const next = [...currentOrder]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= next.length) return
    const a = next[index]
    const b = next[swapIndex]
    if (!a || !b) return
    next[index] = b
    next[swapIndex] = a
    onStateChange({ order: next, hasSelection: true, checked: false })
  }

  const itemMap = new Map(content.items.map((item) => [item.id, item]))

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base leading-7 font-medium text-foreground">
        {content.instruction}
      </p>
      <div className="flex flex-col gap-2">
        {currentOrder.map((id, index) => {
          const item = itemMap.get(id)
          if (!item) return null

          const isCorrectPosition =
            checked && content.correctOrder[index] === id

          let borderClass = "border-border/80"
          if (checked) {
            borderClass = isCorrectPosition ? "border-success" : "border-danger"
          }

          return (
            <div
              key={id}
              className={`flex items-center gap-3 rounded-xl border-2 bg-muted p-3 transition-all ${borderClass}`}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs leading-5 font-semibold tracking-wide text-muted-foreground">
                {index + 1}
              </span>
              <p className="flex-1 text-sm leading-6 font-medium text-foreground">
                {item.text}
              </p>
              {!checked && (
                <div className="flex shrink-0 flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0}
                    aria-label="위로 이동"
                    className="h-7 w-7"
                  >
                    <ChevronUp size={16} strokeWidth={1.5} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveItem(index, "down")}
                    disabled={index === currentOrder.length - 1}
                    aria-label="아래로 이동"
                    className="h-7 w-7"
                  >
                    <ChevronDown size={16} strokeWidth={1.5} />
                  </Button>
                </div>
              )}
              {checked &&
                (isCorrectPosition ? (
                  <Check
                    size={18}
                    strokeWidth={2}
                    className="text-success shrink-0"
                  />
                ) : (
                  <X
                    size={18}
                    strokeWidth={2}
                    className="text-danger shrink-0"
                  />
                ))}
            </div>
          )
        })}
      </div>
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
