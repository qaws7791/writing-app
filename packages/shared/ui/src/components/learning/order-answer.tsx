"use client"

import { useEffect, useState } from "react"

import {
  Sortable,
  SortableContent,
  SortableHandle,
  SortableItem,
} from "#ui/components/learning/sortable"
import { StepBody, StepHeader, StepTitle } from "#ui/components/learning/step"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export type OrderAnswerItem<TId extends string = string> = {
  readonly id: TId
  readonly text: string
}

export function createDeterministicOrder<TItem extends OrderAnswerItem>(
  items: readonly TItem[],
  correctItemIds: readonly string[],
  seed: string
): readonly TItem[] {
  const arr = [...items]
  const random = createSeededRandom(
    `${seed}\u0000${items.map((item) => item.id).join("\u0000")}`
  )

  for (let index = arr.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1))
    const current = arr[index]
    const target = arr[targetIndex]
    if (current !== undefined && target !== undefined) {
      arr[index] = target
      arr[targetIndex] = current
    }
  }

  if (
    arr.length > 1 &&
    arr.every((item, index) => item.id === correctItemIds[index])
  ) {
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

export function OrderAnswer<TId extends string>({
  checked = false,
  correctItemIds,
  defaultOrderedItemIds,
  explanation: _explanation,
  items,
  onChange,
  seed,
  title,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctItemIds: readonly TId[]
  readonly defaultOrderedItemIds?: readonly TId[]
  readonly explanation?: string
  readonly items: readonly OrderAnswerItem<TId>[]
  readonly onChange?: (orderedItemIds: readonly TId[]) => void
  readonly seed?: string
  readonly title?: string
}) {
  const [orderedItems, setOrderedItems] = useState<
    readonly OrderAnswerItem<TId>[]
  >(() => {
    const restoredOrder = resolveInitialOrder(items, defaultOrderedItemIds)
    return restoredOrder === null
      ? createDeterministicOrder(
          items,
          correctItemIds,
          seed ?? items.map((item) => item.id).join("\u0000")
        )
      : restoredOrder
  })

  useEffect(() => {
    onChange?.(orderedItems.map((item) => item.id))
    // Parent may pass an inline callback; only re-emit when order changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedItems])

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>{title || "올바른 순서로 배열하세요"}</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <Sortable
          aria-label="순서 배열"
          disabled={checked !== false}
          getItemLabel={(itemId) =>
            items.find((item) => item.id === itemId)?.text ?? itemId
          }
          onValueChange={(nextIds) => {
            const itemById = new Map(items.map((item) => [item.id, item]))
            const nextItems = nextIds.flatMap((itemId) => {
              const item = itemById.get(itemId)
              return item === undefined ? [] : [item]
            })

            if (nextItems.length === orderedItems.length) {
              setOrderedItems(nextItems)
            }
          }}
          value={orderedItems.map((item) => item.id)}
        >
          {orderedItems.map((item, index) => {
            const isCorrect = correctItemIds[index] === item.id

            return (
              <SortableItem
                key={item.id}
                state={
                  checked === false
                    ? "idle"
                    : isCorrect
                      ? "correct"
                      : "incorrect"
                }
                value={item.id}
              >
                <SortableHandle />
                <SortableContent>{item.text}</SortableContent>
              </SortableItem>
            )
          })}
        </Sortable>
      </StepBody>
    </>
  )
}

function resolveInitialOrder<TId extends string>(
  items: readonly OrderAnswerItem<TId>[],
  orderedItemIds: readonly TId[] | undefined
): readonly OrderAnswerItem<TId>[] | null {
  if (orderedItemIds === undefined || orderedItemIds.length !== items.length) {
    return null
  }

  const itemById = new Map(items.map((item) => [item.id, item]))
  const orderedItems = orderedItemIds.flatMap((id) => {
    const item = itemById.get(id)
    return item === undefined ? [] : [item]
  })

  return orderedItems.length === items.length ? orderedItems : null
}
