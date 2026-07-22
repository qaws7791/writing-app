"use client"

import type { PointerEvent, KeyboardEvent } from "react"
import { useState, useEffect, useRef } from "react"

import { GripVertical } from "lucide-react"

import { cn } from "#ui/lib/utils"
import type { LessonStepCheckedVisual } from "#ui/components/lesson/lesson-step-checked-visual"

export function createDeterministicOrder(
  items: readonly string[],
  correct: readonly string[],
  seed: string
): readonly string[] {
  const arr = [...items]
  const random = createSeededRandom(`${seed}\u0000${items.join("\u0000")}`)

  for (let index = arr.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1))
    const current = arr[index]
    const target = arr[targetIndex]
    if (current !== undefined && target !== undefined) {
      arr[index] = target
      arr[targetIndex] = current
    }
  }

  if (arr.length > 1 && arr.every((value, index) => value === correct[index])) {
    const first = arr.shift()
    if (first !== undefined) arr.push(first)
  }

  return arr
}

function createSeededRandom(seed: string): () => number {
  let state = 2_166_136_261
  for (const character of seed) {
    state ^= character.codePointAt(0) ?? 0
    state = Math.imul(state, 16_777_619)
  }

  return () => {
    state = Math.imul(state, 1_664_525) + 1_013_904_223
    return (state >>> 0) / 4_294_967_296
  }
}

export function OrderAnswer({
  checked = false,
  correctItems,
  explanation,
  items,
  onChange,
  seed,
  showNumbers,
  title,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctItems: readonly string[]
  readonly explanation?: string
  readonly items: readonly string[]
  readonly onChange?: (orderedItems: readonly string[]) => void
  readonly seed?: string
  readonly showNumbers?: boolean
  readonly title?: string
}) {
  const [orderedItems, setOrderedItems] = useState<readonly string[]>(() =>
    createDeterministicOrder(items, correctItems, seed ?? items.join("\u0000"))
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
      <h2 className="font-bold mb-8" style={{ fontSize: "1.75rem" }}>
        {title || "올바른 순서로 배열하세요"}
      </h2>
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
                "bg-surface p-4 rounded-3xl flex items-start gap-3",
                checked !== false &&
                  (isCorrect
                    ? "bg-mint-light text-charcoal"
                    : "bg-coral-light text-charcoal"),
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
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-white touch-none"
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
                <span
                  className="shrink-0 font-black w-6 text-center mt-0.5"
                  style={{ fontSize: "1rem" }}
                >
                  {i + 1}
                </span>
              ) : null}
              <span
                className="font-bold flex-1 min-w-0 break-words whitespace-normal"
                style={{ fontSize: "1rem" }}
              >
                {item}
              </span>
            </div>
          )
        })}
      </div>
      {checked !== false ? (
        <div className="mt-6 bg-surface rounded-4xl p-6">
          <div className="font-bold text-muted-foreground mb-2">정답 순서</div>
          <p className="font-medium">{correctItems.join(" → ")}</p>
          {explanation ? (
            <p className="mt-3 font-medium text-muted-foreground">
              {explanation}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
