import { useState } from "react"
import ReactMarkdown from "react-markdown"

import type { StepProps } from "./step-types"
import type { CategorizeStep } from "../lesson-types"
import { emitAnswer } from "../utils/emit-answer"
import { Badge } from "@workspace/ui/components/ui/badge"
import { Surface } from "@workspace/ui/components/ui/surface"
import { cn } from "@workspace/ui/lib/utils"

const CATEGORY_PALETTE = [
  {
    activeRing: "ring-border-strong/50",
    base: "bg-foreground text-background",
    cardBg: "bg-surface-hover",
  },
  {
    activeRing: "ring-action-selected-bg",
    base: "bg-accent-soft text-accent",
    cardBg: "bg-accent-soft/25",
  },
  {
    activeRing: "ring-success",
    base: "bg-success text-accent",
    cardBg: "bg-success/60",
  },
  {
    activeRing: "ring-danger/60",
    base: "bg-danger text-accent",
    cardBg: "bg-danger/60",
  },
] as const

function getCategoryPalette(index: number): (typeof CATEGORY_PALETTE)[number] {
  return (
    CATEGORY_PALETTE[index % CATEGORY_PALETTE.length] ??
    getDefaultCategoryPalette()
  )
}

function getDefaultCategoryPalette(): (typeof CATEGORY_PALETTE)[number] {
  const palette = CATEGORY_PALETTE[0]

  if (palette === undefined) {
    throw new Error("카테고리 색상 팔레트가 비어 있습니다.")
  }

  return palette
}

export function CategorizeAnswer({
  checked,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
}: StepProps<CategorizeStep>) {
  const [placements, setPlacements] = useState<
    Readonly<Record<string, string>>
  >({})
  const [activeTagId, setActiveTagId] = useState<null | string>(null)

  function getCategoryIndex(categoryId: string): number {
    return step.categories.findIndex((category) => category.id === categoryId)
  }

  function handleTagTap(categoryId: string) {
    if (checked !== false) {
      return
    }

    setActiveTagId((previous) => (previous === categoryId ? null : categoryId))
  }

  function handleItemTap(itemId: string) {
    if (checked !== false || activeTagId === null) {
      return
    }

    const nextPlacements: Record<string, string> = {
      ...placements,
    }

    if (nextPlacements[itemId] === activeTagId) {
      delete nextPlacements[itemId]
    } else {
      nextPlacements[itemId] = activeTagId
    }

    setPlacements(nextPlacements)
    emitAnswer(
      onAnswerChange,
      step.id,
      {
        items: step.items.flatMap((item) => {
          const categoryId = nextPlacements[item.id]

          return categoryId === undefined
            ? []
            : [
                {
                  categoryId,
                  itemId: item.id,
                },
              ]
        }),
        type: "CATEGORIZE",
      },
      onAnswerPayloadChange
    )
  }

  return (
    <div className="select-none flex flex-col" style={{ minHeight: "100%" }}>
      <div className="flex-1">
        <h2 className="mb-2 text-heading-sm font-bold">
          {step.title || "항목을 분류하세요"}
        </h2>
        {step.guide ? (
          <div className="prose prose-sm max-w-none mb-5 prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted prose-p:font-medium prose-strong:text-charcoal prose-li:text-muted prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted">
            <ReactMarkdown>{step.guide}</ReactMarkdown>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 mb-4">
          {step.items.map((item) => {
            const assignedCategoryId = placements[item.id]
            const categoryIndex =
              assignedCategoryId === undefined
                ? -1
                : getCategoryIndex(assignedCategoryId)
            const palette =
              categoryIndex >= 0 ? getCategoryPalette(categoryIndex) : null
            const category =
              assignedCategoryId === undefined
                ? null
                : step.categories.find(
                    (candidate) => candidate.id === assignedCategoryId
                  )
            const isTagged = assignedCategoryId !== undefined
            const isCorrect =
              checked !== false &&
              isTagged &&
              item.categoryId === assignedCategoryId
            const isWrong =
              checked !== false &&
              isTagged &&
              item.categoryId !== assignedCategoryId
            const isClickable = activeTagId !== null && checked === false

            return (
              <div
                className={cn(
                  "rounded-3xl px-4 py-3.5 transition-all duration-200",
                  isCorrect
                    ? "bg-success"
                    : isWrong
                      ? "bg-danger"
                      : isTagged && palette !== null
                        ? palette.cardBg
                        : "bg-surface",
                  isClickable ? "cursor-pointer btn-squish" : "",
                  isClickable && !isTagged
                    ? "ring-2 ring-border-subtle ring-offset-1"
                    : ""
                )}
                key={item.id}
                onClick={() => handleItemTap(item.id)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {isTagged && category != null && palette !== null ? (
                    <Badge className={cn("shrink-0", palette.base)}>
                      {category.label}
                    </Badge>
                  ) : null}
                  <span className="flex-1 text-body-sm font-bold text-foreground">
                    {item.text}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        {checked !== false && step.explanation ? (
          <Surface className="mt-2 an-fi" size="md" variant="panel">
            <div className="mb-2 font-bold text-muted-foreground">해설</div>
            <p className="font-medium">{step.explanation}</p>
          </Surface>
        ) : null}
      </div>
      {checked === false ? (
        <div className="-mx-6 mt-auto shrink-0 bg-gradient-to-t from-bg-canvas via-bg-canvas to-transparent px-6 pb-3 pt-5">
          <div className="mb-2 text-label-sm font-bold uppercase text-muted-foreground">
            태그 선택
          </div>
          <div className="flex flex-wrap gap-2">
            {step.categories.map((category, idx) => {
              const isActive = activeTagId === category.id
              const palette = getCategoryPalette(idx)

              return (
                <button
                  key={category.id}
                  onClick={() => handleTagTap(category.id)}
                  className={cn(
                    "rounded-full px-4 py-2 font-bold btn-squish transition-all duration-150 text-body-sm cursor-pointer outline-none border",
                    isActive
                      ? cn(
                          "scale-95 ring-3 ring-offset-1",
                          palette.activeRing,
                          palette.base
                        )
                      : "bg-surface border-border text-foreground hover:bg-surface-hover"
                  )}
                  type="button"
                >
                  {category.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
