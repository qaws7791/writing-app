"use client"

import { useState } from "react"

import { buttonVariants } from "#ui/components/ui/button"
import { cn } from "#ui/lib/utils"
import type { LessonStepCheckedVisual } from "#ui/components/lesson/lesson-step-checked-visual"
import { MarkdownContent } from "#ui/components/lesson/markdown-content"

const CATEGORY_PALETTE = [
  {
    activeRing: "ring-charcoal/50",
    base: "bg-charcoal text-cream",
    cardBg: "bg-charcoal/10 hover:bg-charcoal/10",
  },
  {
    activeRing: "ring-accent",
    base: "bg-accent text-accent-foreground",
    cardBg: "bg-accent/25 hover:bg-accent/25",
  },
  {
    activeRing: "ring-mint",
    base: "bg-mint text-ink",
    cardBg: "bg-mint/20 hover:bg-mint/20",
  },
  {
    activeRing: "ring-coral/60",
    base: "bg-coral text-ink",
    cardBg: "bg-coral/10 hover:bg-coral/10",
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

export type CategorizePlacement = {
  readonly categoryId: string
  readonly itemId: string
}

export function CategorizeAnswer({
  categories,
  checked = false,
  defaultPlacements,
  explanation,
  guide,
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
  readonly guide: string
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
  const [activeTagId, setActiveTagId] = useState<null | string>(null)

  function getCategoryIndex(categoryId: string): number {
    return categories.findIndex((category) => category.id === categoryId)
  }

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
    emitChange(nextPlacements)
  }

  return (
    <div className="select-none flex flex-col" style={{ minHeight: "100%" }}>
      <div className="flex-1">
        <h2
          className="font-bold mb-2"
          style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
        >
          {title || "항목을 분류하세요"}
        </h2>
        {guide ? (
          <MarkdownContent className="mb-5">{guide}</MarkdownContent>
        ) : null}
        <div className="flex flex-col gap-3 mb-4">
          {items.map((item) => {
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
                : categories.find(
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
              <button
                aria-pressed={
                  activeTagId !== null && assignedCategoryId === activeTagId
                }
                className={buttonVariants({
                  className: cn(
                    "h-auto w-full justify-start rounded-3xl px-4 py-3.5 text-left disabled:opacity-100",
                    isCorrect
                      ? "bg-mint-light hover:bg-mint-light"
                      : isWrong
                        ? "bg-coral-light hover:bg-coral-light"
                        : isTagged && palette !== null
                          ? palette.cardBg
                          : "bg-surface hover:bg-surface",
                    isClickable ? "cursor-pointer" : "",
                    isClickable && !isTagged
                      ? "ring-2 ring-charcoal/20 ring-offset-1"
                      : ""
                  ),
                  variant: "secondary",
                })}
                key={item.id}
                disabled={!isClickable}
                onClick={() => handleItemTap(item.id)}
                type="button"
              >
                <div
                  className={cn(
                    "flex gap-1.5",
                    isTagged ? "flex-col items-start" : "items-center"
                  )}
                >
                  {isTagged && category != null && palette !== null ? (
                    <span
                      className={cn(
                        "inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 font-bold",
                        palette.base
                      )}
                      style={{ fontSize: "0.75rem" }}
                    >
                      {category.label}
                    </span>
                  ) : null}
                  <span
                    className="font-bold text-charcoal w-full"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    {item.text}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        {checked !== false && explanation ? (
          <div className="mt-2 bg-surface rounded-4xl p-6 an-fi">
            <div className="font-bold text-muted-foreground mb-2">해설</div>
            <p className="font-medium">{explanation}</p>
          </div>
        ) : null}
      </div>
      {checked === false ? (
        <div className="-mx-6 mt-auto shrink-0 bg-gradient-to-t from-bg-canvas via-bg-canvas to-transparent px-6 pb-3 pt-5">
          <div
            className="font-bold text-muted-foreground mb-2 tracking-widest"
            style={{ fontSize: "0.75rem" }}
          >
            태그 선택
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, idx) => {
              const isActive = activeTagId === category.id
              const palette = getCategoryPalette(idx)

              return (
                <button
                  aria-pressed={isActive}
                  key={category.id}
                  onClick={() => handleTagTap(category.id)}
                  className={buttonVariants({
                    className: cn(
                      "h-auto cursor-pointer rounded-full px-4 py-2 text-body-sm",
                      palette.base,
                      isActive
                        ? cn("scale-95 ring-4 opacity-75", palette.activeRing)
                        : ""
                    ),
                    size: "sm",
                  })}
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
