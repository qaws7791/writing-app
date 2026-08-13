"use client"

import { useState } from "react"

import {
  Classify,
  ClassifyCategories,
  ClassifyCategory,
  ClassifyItem,
  ClassifyItemLabel,
  ClassifyItemTag,
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
  const [activeCategoryId, setActiveCategoryId] = useState<null | string>(null)

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

  function handleCategorySelect(categoryId: string) {
    if (checked !== false) return
    setActiveCategoryId((previous) =>
      previous === categoryId ? null : categoryId
    )
  }

  function handleItemSelect(itemId: string) {
    if (checked !== false || activeCategoryId === null) return

    const nextPlacements: Record<string, string> = { ...placements }

    if (nextPlacements[itemId] === activeCategoryId) {
      delete nextPlacements[itemId]
    } else {
      nextPlacements[itemId] = activeCategoryId
    }

    setPlacements(nextPlacements)
    emitChange(nextPlacements)
  }

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>{title || "항목을 분류하세요"}</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <Classify>
          <div className="flex flex-col gap-2">
            <ClassifyCategories>
              {categories.map((category, index) => (
                <ClassifyCategory
                  aria-pressed={activeCategoryId === category.id}
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  series={learningSeriesAt(index)}
                  state={
                    checked !== false
                      ? "locked"
                      : activeCategoryId === category.id
                        ? "active"
                        : "idle"
                  }
                >
                  {category.label}
                </ClassifyCategory>
              ))}
            </ClassifyCategories>
            {checked === false && activeCategoryId === null ? (
              <p className="text-xs text-muted-foreground">
                분류를 고르면 아래 항목을 넣을 수 있습니다
              </p>
            ) : null}
          </div>
          <ClassifyPool>
            {items.map((item) => {
              const assignedCategoryId = placements[item.id]
              const categoryIndex = categories.findIndex(
                (candidate) => candidate.id === assignedCategoryId
              )
              const category =
                categoryIndex === -1 ? undefined : categories[categoryIndex]
              const state: ClassifyState =
                checked === false
                  ? assignedCategoryId === undefined
                    ? "idle"
                    : "placed"
                  : assignedCategoryId === undefined
                    ? "locked"
                    : item.categoryId === assignedCategoryId
                      ? "correct"
                      : "incorrect"

              return (
                <ClassifyItem
                  aria-pressed={
                    activeCategoryId !== null &&
                    assignedCategoryId === activeCategoryId
                  }
                  disabled={checked !== false || activeCategoryId === null}
                  key={item.id}
                  onClick={() => handleItemSelect(item.id)}
                  state={state}
                >
                  <ClassifyItemLabel>{item.text}</ClassifyItemLabel>
                  {category === undefined ? null : (
                    <ClassifyItemTag series={learningSeriesAt(categoryIndex)}>
                      {category.label}
                    </ClassifyItemTag>
                  )}
                </ClassifyItem>
              )
            })}
          </ClassifyPool>
        </Classify>
      </StepBody>
    </>
  )
}
