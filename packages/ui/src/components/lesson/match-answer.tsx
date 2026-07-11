"use client"

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"

import { cn } from "../../lib/utils"
import type { LessonStepCheckedVisual } from "./lesson-step-checked-visual"
import { MarkdownContent } from "./markdown-content"
import {
  createMatchStepPresentation,
  findMatchedLeftChoiceIdForRightChoiceId,
  isCorrectMatchChoice,
  toMatchAnswerPairs,
  toggleMatchSelection,
  type MatchAnswerPair,
  type MatchChoiceId,
  type MatchSelectionMap,
  type MatchStepPresentation,
} from "./match-presentation"

type PendingMatchChoice =
  | { readonly id: MatchChoiceId; readonly side: "left" }
  | { readonly id: MatchChoiceId; readonly side: "right" }

type MatchConnectionLine = {
  readonly id: string
  readonly tone: "correct" | "default" | "wrong"
  readonly x1: number
  readonly x2: number
  readonly y1: number
  readonly y2: number
}

function getMatchButtonClassName({
  checked,
  isActive,
  isCorrect,
  isPaired,
  isWrong,
}: {
  readonly checked: LessonStepCheckedVisual | false
  readonly isActive: boolean
  readonly isCorrect: boolean
  readonly isPaired: boolean
  readonly isWrong: boolean
}) {
  if (checked !== false) {
    if (isCorrect) return "bg-mint-light text-charcoal"
    if (isWrong) return "bg-coral-light text-charcoal"
  }

  if (isActive) {
    return "bg-charcoal text-cream shadow-lg scale-[1.02]"
  }

  if (isPaired) {
    return "bg-accent text-accent-foreground"
  }

  return "bg-surface text-charcoal hover:bg-accent/30"
}

function measureMatchConnectionLines({
  checked,
  gridElement,
  matchMap,
  presentation,
  choiceElements,
}: {
  readonly checked: LessonStepCheckedVisual | false
  readonly choiceElements: ReadonlyMap<MatchChoiceId, HTMLButtonElement>
  readonly gridElement: HTMLElement
  readonly matchMap: MatchSelectionMap
  readonly presentation: MatchStepPresentation
}): readonly MatchConnectionLine[] {
  const gridRect = gridElement.getBoundingClientRect()

  return Object.entries(matchMap).flatMap(([leftId, rightId]) => {
    const leftElement = choiceElements.get(leftId as MatchChoiceId)
    const rightElement = choiceElements.get(rightId)

    if (leftElement === undefined || rightElement === undefined) {
      return []
    }

    const leftRect = leftElement.getBoundingClientRect()
    const rightRect = rightElement.getBoundingClientRect()
    const isCorrect =
      checked !== false &&
      isCorrectMatchChoice(presentation, leftId as MatchChoiceId, rightId)
    const isWrong = checked !== false && !isCorrect

    return [
      {
        id: `${leftId}-${rightId}`,
        tone: isCorrect ? "correct" : isWrong ? "wrong" : "default",
        x1: leftRect.right - gridRect.left,
        x2: rightRect.left - gridRect.left,
        y1: leftRect.top + leftRect.height / 2 - gridRect.top,
        y2: rightRect.top + rightRect.height / 2 - gridRect.top,
      },
    ]
  })
}

function MatchConnectionOverlay({
  lines,
}: {
  readonly lines: readonly MatchConnectionLine[]
}) {
  if (lines.length === 0) {
    return null
  }

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      {lines.map((line) => (
        <line
          className={cn(
            "stroke-[2.5]",
            line.tone === "correct" && "stroke-mint-dark",
            line.tone === "wrong" && "stroke-coral-dark",
            line.tone === "default" && "stroke-charcoal/60"
          )}
          key={line.id}
          strokeLinecap="round"
          x1={line.x1}
          x2={line.x2}
          y1={line.y1}
          y2={line.y2}
        />
      ))}
    </svg>
  )
}

export function MatchAnswer({
  checked = false,
  explanation,
  guide,
  onChange,
  pairs,
  title,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly explanation?: string
  readonly guide: string
  readonly onChange?: (_pairs: readonly MatchAnswerPair[]) => void
  readonly pairs: readonly {
    readonly left: string
    readonly right: string
  }[]
  readonly title: string
}) {
  const [matchMap, setMatchMap] = useState<MatchSelectionMap>({})
  const [pendingChoice, setPendingChoice] = useState<PendingMatchChoice | null>(
    null
  )
  const [connectionLines, setConnectionLines] = useState<
    readonly MatchConnectionLine[]
  >([])
  const gridRef = useRef<HTMLDivElement>(null)
  const choiceRefs = useRef(new Map<MatchChoiceId, HTMLButtonElement>())
  const presentation = useMemo(
    () => createMatchStepPresentation({ pairs }),
    [pairs]
  )

  const registerChoiceRef = useCallback(
    (choiceId: MatchChoiceId, node: HTMLButtonElement | null) => {
      if (node === null) {
        choiceRefs.current.delete(choiceId)
        return
      }

      choiceRefs.current.set(choiceId, node)
    },
    []
  )

  const updateConnectionLines = useCallback(() => {
    const gridElement = gridRef.current

    if (gridElement === null) {
      setConnectionLines([])
      return
    }

    setConnectionLines(
      measureMatchConnectionLines({
        checked,
        choiceElements: choiceRefs.current,
        gridElement,
        matchMap,
        presentation,
      })
    )
  }, [checked, matchMap, presentation])

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks-js/set-state-in-effect
    updateConnectionLines()

    const gridElement = gridRef.current

    if (gridElement === null) {
      return
    }

    let resizeObserver: ResizeObserver | undefined

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateConnectionLines()
      })
      resizeObserver.observe(gridElement)

      for (const element of choiceRefs.current.values()) {
        resizeObserver.observe(element)
      }
    }

    window.addEventListener("resize", updateConnectionLines)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener("resize", updateConnectionLines)
    }
  }, [updateConnectionLines])

  function applyMatchSelection(nextMap: MatchSelectionMap) {
    setMatchMap(nextMap)
    onChange?.(toMatchAnswerPairs(presentation, nextMap))
    setPendingChoice(null)
  }

  function handleLeftTap(leftChoiceId: MatchChoiceId) {
    if (checked !== false) {
      return
    }

    if (pendingChoice === null) {
      setPendingChoice({ id: leftChoiceId, side: "left" })
      return
    }

    if (pendingChoice.side === "left") {
      setPendingChoice(
        pendingChoice.id === leftChoiceId
          ? null
          : { id: leftChoiceId, side: "left" }
      )
      return
    }

    applyMatchSelection(
      toggleMatchSelection(matchMap, {
        leftChoiceId,
        rightChoiceId: pendingChoice.id,
      })
    )
  }

  function handleRightTap(rightChoiceId: MatchChoiceId) {
    if (checked !== false) {
      return
    }

    if (pendingChoice === null) {
      setPendingChoice({ id: rightChoiceId, side: "right" })
      return
    }

    if (pendingChoice.side === "right") {
      setPendingChoice(
        pendingChoice.id === rightChoiceId
          ? null
          : { id: rightChoiceId, side: "right" }
      )
      return
    }

    applyMatchSelection(
      toggleMatchSelection(matchMap, {
        leftChoiceId: pendingChoice.id,
        rightChoiceId,
      })
    )
  }

  return (
    <div className="an-fi">
      <h2
        className="font-bold mb-2"
        style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
      >
        {title || "짝을 맞춰보세요"}
      </h2>
      {guide ? (
        <MarkdownContent className="mb-6">{guide}</MarkdownContent>
      ) : (
        <p className="text-muted-foreground font-medium mb-6">
          양쪽 항목을 차례로 탭해 짝을 맞추세요. 같은 항목을 다시 탭하면 선택을
          취소할 수 있습니다.
        </p>
      )}
      <div className="relative" ref={gridRef}>
        <MatchConnectionOverlay lines={connectionLines} />
        <div className="relative z-10 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-3">
            {presentation.leftChoices.map((leftChoice) => {
              const matchedRightChoiceId = matchMap[leftChoice.id]
              const isCorrect =
                checked !== false &&
                matchedRightChoiceId !== undefined &&
                isCorrectMatchChoice(
                  presentation,
                  leftChoice.id,
                  matchedRightChoiceId
                )
              const isWrong =
                checked !== false &&
                matchedRightChoiceId !== undefined &&
                !isCorrectMatchChoice(
                  presentation,
                  leftChoice.id,
                  matchedRightChoiceId
                )
              const isActive =
                pendingChoice?.side === "left" &&
                pendingChoice.id === leftChoice.id
              const isPaired = matchedRightChoiceId !== undefined

              return (
                <button
                  className={cn(
                    "w-full rounded-3xl p-4 font-bold text-center transition-all duration-150 active:scale-95",
                    getMatchButtonClassName({
                      checked,
                      isActive,
                      isCorrect,
                      isPaired,
                      isWrong,
                    })
                  )}
                  disabled={checked !== false}
                  key={leftChoice.id}
                  onClick={() => handleLeftTap(leftChoice.id)}
                  ref={(node) => registerChoiceRef(leftChoice.id, node)}
                  style={{ fontSize: "1rem", minHeight: "3.5rem" }}
                  type="button"
                >
                  {leftChoice.text}
                </button>
              )
            })}
          </div>
          <div className="flex flex-col gap-3">
            {presentation.rightChoices.map((rightChoice) => {
              const pairedLeftChoiceId =
                findMatchedLeftChoiceIdForRightChoiceId(
                  matchMap,
                  rightChoice.id
                )
              const isActive =
                pendingChoice?.side === "right" &&
                pendingChoice.id === rightChoice.id
              const isCorrect =
                checked !== false &&
                pairedLeftChoiceId !== null &&
                isCorrectMatchChoice(
                  presentation,
                  pairedLeftChoiceId,
                  rightChoice.id
                )
              const isWrong =
                checked !== false &&
                pairedLeftChoiceId !== null &&
                !isCorrectMatchChoice(
                  presentation,
                  pairedLeftChoiceId,
                  rightChoice.id
                )
              const isPaired = pairedLeftChoiceId !== null

              return (
                <button
                  className={cn(
                    "w-full rounded-3xl p-4 font-bold text-center transition-all duration-150 active:scale-95",
                    getMatchButtonClassName({
                      checked,
                      isActive,
                      isCorrect,
                      isPaired,
                      isWrong,
                    })
                  )}
                  disabled={checked !== false}
                  key={rightChoice.id}
                  onClick={() => handleRightTap(rightChoice.id)}
                  ref={(node) => registerChoiceRef(rightChoice.id, node)}
                  style={{ fontSize: "1rem", minHeight: "3.5rem" }}
                  type="button"
                >
                  {rightChoice.text}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      {checked !== false && explanation ? (
        <div className="mt-6 bg-surface rounded-4xl p-6">
          <div className="font-bold text-muted-foreground mb-2">해설</div>
          <p className="font-medium">{explanation}</p>
        </div>
      ) : null}
    </div>
  )
}
