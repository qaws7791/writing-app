"use client"

import type { PointerEvent, KeyboardEvent } from "react"
import { useState, useEffect, useRef } from "react"

import { GripVertical } from "lucide-react"

import { Surface } from "../ui/surface"
import { cn } from "../../lib/utils"
import type { LessonStepCheckedVisual } from "./lesson-step-checked-visual"

function shuffleNotEqual(
  items: readonly string[],
  correct: readonly string[]
): readonly string[] {
  const arr = [...items]
  for (let attempt = 0; attempt < 5; attempt++) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = arr[i]
      const nextVal = arr[j]
      if (temp !== undefined && nextVal !== undefined) {
        arr[i] = nextVal
        arr[j] = temp
      }
    }
    const sameAsCorrect = arr.every((v, i) => v === correct[i])
    if (!sameAsCorrect || arr.length <= 1) return arr
  }
  return arr
}

export function OrderAnswer({
  checked = false,
  correctItems,
  explanation,
  items,
  onChange,
  showNumbers,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctItems: readonly string[]
  readonly explanation?: string
  readonly items: readonly string[]
  readonly onChange?: (orderedItems: readonly string[]) => void
  readonly showNumbers?: boolean
}) {
  const [orderedItems, setOrderedItems] = useState<readonly string[]>(() =>
    shuffleNotEqual(items, correctItems)
  )
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStateRef = useRef<{
    startY: number
    startIndex: number
    rects: DOMRect[]
  } | null>(null)

  useEffect(() => {
    onChange?.(orderedItems)
    // Parent may pass an inline callback; only re-emit when order changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedItems])

  const onPointerDown = (e: PointerEvent, index: number) => {
    if (checked !== false) return
    e.preventDefault()
    if (typeof (e.target as HTMLElement).setPointerCapture === "function") {
      try {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // ignore in headless test environments
      }
    }
    const rects = itemRefs.current
      .filter((el): el is HTMLDivElement => el !== null)
      .map((el) => el.getBoundingClientRect())
    dragStateRef.current = { startY: e.clientY, startIndex: index, rects }
    setDragIndex(index)
    setHoverIndex(index)
    setDragOffset(0)
  }

  const onPointerMove = (e: PointerEvent) => {
    const state = dragStateRef.current
    if (!state) return
    const dy = e.clientY - state.startY
    setDragOffset(dy)
    const draggedRect = state.rects[state.startIndex]
    if (!draggedRect) return
    const draggedCenter = draggedRect.top + draggedRect.height / 2 + dy
    let target = state.startIndex
    for (let i = 0; i < state.rects.length; i++) {
      if (i === state.startIndex) continue
      const r = state.rects[i]
      if (!r) continue
      const center = r.top + r.height / 2
      if (i < state.startIndex && draggedCenter < center) {
        target = i
        break
      }
      if (i > state.startIndex && draggedCenter > center) {
        target = i
      }
    }
    setHoverIndex(target)
  }

  const onPointerUp = (e: PointerEvent) => {
    const state = dragStateRef.current
    if (!state) return
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // releasePointerCapture can throw in non-pointer/headless test environments
    }
    if (hoverIndex !== null && hoverIndex !== state.startIndex) {
      const next = [...orderedItems]
      const [moved] = next.splice(state.startIndex, 1)
      if (moved !== undefined) {
        next.splice(hoverIndex, 0, moved)
        setOrderedItems(next)
      }
    }
    dragStateRef.current = null
    setDragIndex(null)
    setHoverIndex(null)
    setDragOffset(0)
  }

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (checked !== false) return
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
    const dir = e.key === "ArrowUp" ? -1 : 1
    const j = index + dir
    if (j < 0 || j >= orderedItems.length) return
    e.preventDefault()
    const next = [...orderedItems]
    const temp = next[index]
    const targetVal = next[j]
    if (temp !== undefined && targetVal !== undefined) {
      next[index] = targetVal
      next[j] = temp
      setOrderedItems(next)
    }
  }

  return (
    <div className="an-fi">
      <div className="space-y-3 mb-6 select-none">
        {orderedItems.map((item, i) => {
          const isCorrect = correctItems[i] === item
          const isDragging = dragIndex === i
          let translateY = 0
          if (dragIndex !== null && hoverIndex !== null && !isDragging) {
            const rects = dragStateRef.current?.rects
            if (rects) {
              const draggedRect = rects[dragIndex]
              if (draggedRect) {
                const draggedH = draggedRect.height + 12
                if (dragIndex < i && i <= hoverIndex) translateY = -draggedH
                else if (dragIndex > i && i >= hoverIndex) translateY = draggedH
              }
            }
          }

          return (
            <div
              className={cn(
                "bg-surface p-4 rounded-card flex items-start gap-3 border border-border",
                checked !== false &&
                  (isCorrect
                    ? "border-success-fg/20 bg-success text-success-foreground"
                    : "border-danger-fg/20 bg-danger text-danger-foreground"),
                isDragging && "shadow-lg"
              )}
              key={`${item}-${i}`}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              style={{
                position: "relative",
                transform: isDragging
                  ? `translateY(${dragOffset}px)`
                  : `translateY(${translateY}px)`,
                transition: isDragging ? "none" : "transform 180ms ease",
                zIndex: isDragging ? 10 : 0,
              }}
            >
              {checked === false ? (
                <button
                  aria-label="드래그하여 순서 변경"
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 touch-none"
                  onPointerCancel={onPointerUp}
                  onPointerDown={(e) => onPointerDown(e, i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  style={{ cursor: isDragging ? "grabbing" : "grab" }}
                  type="button"
                >
                  <GripVertical size={18} />
                </button>
              ) : null}
              {showNumbers ? (
                <span className="shrink-0 font-black w-6 text-center mt-0.5 text-body-md">
                  {i + 1}
                </span>
              ) : null}
              <span className="font-bold flex-1 min-w-0 break-words whitespace-normal text-body-md">
                {item}
              </span>
            </div>
          )
        })}
      </div>
      {checked !== false ? (
        <Surface className="mt-6" size="md" variant="panel">
          <div className="font-bold text-muted-foreground mb-2">정답 순서</div>
          <p className="font-medium text-body-md">{correctItems.join(" → ")}</p>
          {explanation ? (
            <p className="mt-3 font-medium text-muted-foreground text-body-sm">
              {explanation}
            </p>
          ) : null}
        </Surface>
      ) : null}
    </div>
  )
}
