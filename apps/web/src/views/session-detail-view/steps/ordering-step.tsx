import { HugeiconsIcon } from "@hugeicons/react"
import {
  Tick02Icon,
  Cancel01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"

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
              className={`flex items-center gap-3 rounded-xl border-2 bg-surface-container p-3 transition-all ${borderClass}`}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-label-medium-em text-on-surface-low">
                {index + 1}
              </span>
              <p className="flex-1 text-body-medium-em text-on-surface">
                {item.text}
              </p>
              {!checked && (
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0}
                    className="rounded p-0.5 text-on-surface-lowest hover:text-on-surface disabled:opacity-30"
                  >
                    <HugeiconsIcon
                      icon={ArrowUp01Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                  </button>
                  <button
                    onClick={() => moveItem(index, "down")}
                    disabled={index === currentOrder.length - 1}
                    className="rounded p-0.5 text-on-surface-lowest hover:text-on-surface disabled:opacity-30"
                  >
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                  </button>
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
        <div className="rounded-xl bg-surface-container p-4">
          <p className="text-xs font-semibold text-on-surface-lowest">해설</p>
          <p className="text-sm leading-relaxed mt-1 text-on-surface-low">
            {content.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
