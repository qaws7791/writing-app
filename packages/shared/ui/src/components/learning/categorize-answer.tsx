"use client"

import { useState } from "react"

import {
  Classify,
  ClassifyBasket,
  ClassifyBaskets,
  ClassifyItem,
  ClassifyItemLabel,
  ClassifyPool,
  type ClassifyState,
} from "#ui/components/learning/classify"
import { StepBody, StepHeader, StepTitle } from "#ui/components/learning/step"
import { learningSeriesAt } from "#ui/lib/learning-series"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export type CategorizePlacement = {
  readonly categoryId: string
  readonly itemId: string
}

export function CategorizeAnswer({
  categories,
  checked = false,
  defaultPlacements,
  explanation: _explanation,
  items,
  onChange,
  title,
}: {
  readonly categories: readonly {
    readonly id: string
    readonly label: string
  }[]
  readonly checked?: LessonStepCheckedVisual
  readonly defaultPlacements?: Readonly<Record<string, string>>
  readonly explanation?: string
  readonly items: readonly {
    readonly categoryId: string
    readonly id: string
    readonly text: string
  }[]
  readonly onChange?: (placements: readonly CategorizePlacement[]) => void
  readonly title: string
}) {
  const [placements, setPlacements] = useState<
    Readonly<Record<string, string>>
  >(() => defaultPlacements ?? {})

  function emitChange(nextPlacements: Readonly<Record<string, string>>) {
    onChange?.(
      items.flatMap((item) => {
        const categoryId = nextPlacements[item.id]

        return categoryId === undefined
          ? []
          : [
              {
                categoryId,
                itemId: item.id,
              },
            ]
      })
    )
  }

  function handlePlace(itemId: string, categoryId: string | null) {
    if (checked !== false) return

    const nextPlacements: Record<string, string> = { ...placements }

    if (categoryId === null) {
      delete nextPlacements[itemId]
    } else {
      nextPlacements[itemId] = categoryId
    }

    setPlacements(nextPlacements)
    emitChange(nextPlacements)
  }

  function itemState(
    itemId: string,
    assignedCategoryId?: string
  ): ClassifyState {
    if (checked === false) {
      return assignedCategoryId === undefined ? "idle" : "placed"
    }

    if (assignedCategoryId === undefined) return "locked"

    const item = items.find((candidate) => candidate.id === itemId)
    return item?.categoryId === assignedCategoryId ? "correct" : "incorrect"
  }

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h1>{title || "항목을 분류하세요"}</h1>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <Classify
          disabled={checked !== false}
          getCategoryLabel={(categoryId) =>
            categories.find((category) => category.id === categoryId)?.label ??
            categoryId
          }
          getItemLabel={(itemId) =>
            items.find((item) => item.id === itemId)?.text ?? itemId
          }
          onPlace={handlePlace}
        >
          <ClassifyPool>
            {items
              .filter((item) => placements[item.id] === undefined)
              .map((item) => (
                <ClassifyItem
                  id={item.id}
                  key={item.id}
                  state={itemState(item.id)}
                >
                  <ClassifyItemLabel>{item.text}</ClassifyItemLabel>
                </ClassifyItem>
              ))}
          </ClassifyPool>
          <ClassifyBaskets>
            {categories.map((category, index) => (
              <ClassifyBasket
                id={category.id}
                key={category.id}
                label={category.label}
                series={learningSeriesAt(index)}
                state={checked !== false ? "locked" : "idle"}
              >
                {items
                  .filter((item) => placements[item.id] === category.id)
                  .map((item) => (
                    <ClassifyItem
                      id={item.id}
                      key={item.id}
                      state={itemState(item.id, category.id)}
                    >
                      <ClassifyItemLabel>{item.text}</ClassifyItemLabel>
                    </ClassifyItem>
                  ))}
              </ClassifyBasket>
            ))}
          </ClassifyBaskets>
        </Classify>
      </StepBody>
    </>
  )
}
