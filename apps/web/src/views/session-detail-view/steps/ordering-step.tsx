import { HugeiconsIcon } from "@hugeicons/react"
import {
  Tick02Icon,
  Cancel01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"

import type {
  OrderingContent,
  OrderingState,
  InteractiveStepProps,
} from "@/views/session-detail-view/types"

type Props = InteractiveStepProps<OrderingContent, OrderingState>

export function OrderingStep({ content, state, onStateChange }: Props) {
  const checked = state?.checked === true
  const currentOrder = state?.order ?? content.items.map((item) => item.id)

  function moveItem(index: number, direction: "up" | "down") {
    if (checked) return
    const next = [...currentOrder]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= next.length) return
    const a = next[index]!
    const b = next[swapIndex]!
    next[index] = b
    next[swapIndex] = a
    onStateChange({ order: next, hasSelection: true, checked: false })
  }

  const itemMap = new Map(content.items.map((item) => [item.id, item]))

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body-large-em text-on-surface">
        {content.instruction}
      </p>
      <div className="flex flex-col gap-2">
        {currentOrder.map((id, index) => {
          const item = itemMap.get(id)
          if (!item) return null

          const isCorrectPosition =
            checked && content.correctOrder[index] === id

          let borderClass = "border-outline/10"
          if (checked) {
            borderClass = isCorrectPosition
              ? "border-green-500"
              : "border-red-500"
          }

          return (
            <div
              key={id}
              className={`bg-surface-container flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${borderClass}`}
            >
              <span className="bg-surface-container-high text-label-medium-em text-on-surface-low flex size-7 shrink-0 items-center justify-center rounded-full">
                {index + 1}
              </span>
              <p className="text-body-medium-em text-on-surface flex-1">
                {item.text}
              </p>
              {!checked && (
                <div className="flex shrink-0 flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    isIconOnly
                    size="sm"
                    onClick={() => moveItem(index, "up")}
                    isDisabled={index === 0}
                    aria-label="위로 이동"
                  >
                    <HugeiconsIcon
                      icon={ArrowUp01Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    isIconOnly
                    size="sm"
                    onClick={() => moveItem(index, "down")}
                    isDisabled={index === currentOrder.length - 1}
                    aria-label="아래로 이동"
                  >
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                  </Button>
                </div>
              )}
              {checked && (
                <HugeiconsIcon
                  icon={isCorrectPosition ? Tick02Icon : Cancel01Icon}
                  size={18}
                  color={
                    isCorrectPosition ? "rgb(34 197 94)" : "rgb(239 68 68)"
                  }
                  strokeWidth={2}
                  className="shrink-0"
                />
              )}
            </div>
          )
        })}
      </div>
      {checked && (
        <div className="bg-surface-container rounded-xl p-4">
          <p className="text-label-medium-em text-on-surface-lowest">해설</p>
          <p className="text-body-medium text-on-surface-low mt-1">
            {content.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
