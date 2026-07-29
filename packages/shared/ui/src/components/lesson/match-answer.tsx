"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"

import { cn } from "#ui/lib/utils"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"
import { MarkdownContent } from "#ui/components/lesson/markdown-content"

export type MatchAnswerChoice = {
  readonly id: string
  readonly text: string
}

export type MatchAnswerChoiceSelection = {
  readonly id: string
  readonly side: "left" | "right"
}

export type MatchAnswerConnection = {
  readonly leftChoiceId: string
  readonly rightChoiceId: string
  readonly tone: "correct" | "default" | "wrong"
}

type MatchConnectionLine = {
  readonly id: string
  readonly tone: MatchAnswerConnection["tone"]
  readonly x1: number
  readonly x2: number
  readonly y1: number
  readonly y2: number
}

function getMatchButtonClassName({
  checked,
  isActive,
  isPaired,
  tone,
}: {
  readonly checked: LessonStepCheckedVisual | false
  readonly isActive: boolean
  readonly isPaired: boolean
  readonly tone?: MatchAnswerConnection["tone"]
}) {
  if (checked !== false) {
    if (tone === "correct") return "bg-success text-success-foreground"
    if (tone === "wrong") return "bg-danger text-danger-foreground"
  }

  if (isActive) {
    return "bg-action-primary-bg text-action-primary-fg shadow-lg scale-[1.02]"
  }

  if (isPaired) {
    return "bg-action-selected-bg text-action-selected-fg"
  }

  return "bg-bg-surface text-fg-default hover:bg-action-selected-bg"
}

function measureMatchConnectionLines({
  choiceElements,
  connections,
  gridElement,
}: {
  readonly choiceElements: ReadonlyMap<string, HTMLButtonElement>
  readonly connections: readonly MatchAnswerConnection[]
  readonly gridElement: HTMLElement
}): readonly MatchConnectionLine[] {
  const gridRect = gridElement.getBoundingClientRect()

  return connections.flatMap((connection) => {
    const leftElement = choiceElements.get(connection.leftChoiceId)
    const rightElement = choiceElements.get(connection.rightChoiceId)

    if (leftElement === undefined || rightElement === undefined) {
      return []
    }

    const leftRect = leftElement.getBoundingClientRect()
    const rightRect = rightElement.getBoundingClientRect()

    return [
      {
        id: `${connection.leftChoiceId}-${connection.rightChoiceId}`,
        tone: connection.tone,
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
            line.tone === "correct" && "stroke-success-fg",
            line.tone === "wrong" && "stroke-danger-fg",
            line.tone === "default" && "stroke-fg-muted"
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
  connections,
  explanation,
  guide,
  leftChoices,
  onChoiceSelect,
  pendingChoice = null,
  rightChoices,
  title,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly connections: readonly MatchAnswerConnection[]
  readonly explanation?: string
  readonly guide: string
  readonly leftChoices: readonly MatchAnswerChoice[]
  readonly onChoiceSelect?: (selection: MatchAnswerChoiceSelection) => void
  readonly pendingChoice?: MatchAnswerChoiceSelection | null
  readonly rightChoices: readonly MatchAnswerChoice[]
  readonly title: string
}) {
  const [connectionLines, setConnectionLines] = useState<
    readonly MatchConnectionLine[]
  >([])
  const gridRef = useRef<HTMLDivElement>(null)
  const choiceRefs = useRef(new Map<string, HTMLButtonElement>())

  const registerChoiceRef = useCallback(
    (choiceId: string, node: HTMLButtonElement | null) => {
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
        choiceElements: choiceRefs.current,
        connections,
        gridElement,
      })
    )
  }, [connections])

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
        <p className="text-fg-muted font-medium mb-6">
          양쪽 항목을 차례로 탭해 짝을 맞추세요. 같은 항목을 다시 탭하면 선택을
          취소할 수 있습니다.
        </p>
      )}
      <div className="relative" ref={gridRef}>
        <MatchConnectionOverlay lines={connectionLines} />
        <div className="relative z-10 grid grid-cols-2 gap-3">
          <div
            aria-label="왼쪽 선택지"
            className="flex flex-col gap-3"
            role="group"
          >
            {leftChoices.map((leftChoice) => {
              const connection = connections.find(
                (candidate) => candidate.leftChoiceId === leftChoice.id
              )
              const isActive =
                pendingChoice?.side === "left" &&
                pendingChoice.id === leftChoice.id
              const isPaired = connection !== undefined

              return (
                <MatchChoiceButton
                  checked={checked}
                  choice={leftChoice}
                  isActive={isActive}
                  isPaired={isPaired}
                  key={leftChoice.id}
                  {...(onChoiceSelect === undefined ? {} : { onChoiceSelect })}
                  registerChoiceRef={registerChoiceRef}
                  side="left"
                  {...(connection === undefined
                    ? {}
                    : { tone: connection.tone })}
                />
              )
            })}
          </div>
          <div
            aria-label="오른쪽 선택지"
            className="flex flex-col gap-3"
            role="group"
          >
            {rightChoices.map((rightChoice) => {
              const connection = connections.find(
                (candidate) => candidate.rightChoiceId === rightChoice.id
              )
              const isActive =
                pendingChoice?.side === "right" &&
                pendingChoice.id === rightChoice.id
              const isPaired = connection !== undefined

              return (
                <MatchChoiceButton
                  checked={checked}
                  choice={rightChoice}
                  isActive={isActive}
                  isPaired={isPaired}
                  key={rightChoice.id}
                  {...(onChoiceSelect === undefined ? {} : { onChoiceSelect })}
                  registerChoiceRef={registerChoiceRef}
                  side="right"
                  {...(connection === undefined
                    ? {}
                    : { tone: connection.tone })}
                />
              )
            })}
          </div>
        </div>
      </div>
      {checked !== false && explanation ? (
        <div className="mt-6 bg-bg-surface rounded-4xl p-6">
          <div className="font-bold text-fg-muted mb-2">해설</div>
          <p className="font-medium">{explanation}</p>
        </div>
      ) : null}
    </div>
  )
}

function MatchChoiceButton({
  checked,
  choice,
  isActive,
  isPaired,
  onChoiceSelect,
  registerChoiceRef,
  side,
  tone,
}: {
  readonly checked: LessonStepCheckedVisual
  readonly choice: MatchAnswerChoice
  readonly isActive: boolean
  readonly isPaired: boolean
  readonly onChoiceSelect?: (selection: MatchAnswerChoiceSelection) => void
  readonly registerChoiceRef: (
    choiceId: string,
    node: HTMLButtonElement | null
  ) => void
  readonly side: "left" | "right"
  readonly tone?: MatchAnswerConnection["tone"]
}) {
  return (
    <button
      aria-pressed={isActive || isPaired}
      className={cn(
        "w-full rounded-3xl p-4 font-bold text-center transition-all duration-150 active:scale-95",
        getMatchButtonClassName({
          checked,
          isActive,
          isPaired,
          ...(tone === undefined ? {} : { tone }),
        })
      )}
      data-state={
        isActive ? "active" : (tone ?? (isPaired ? "paired" : "idle"))
      }
      data-choice-id={choice.id}
      data-side={side}
      disabled={checked !== false}
      onClick={() => onChoiceSelect?.({ id: choice.id, side })}
      ref={(node) => registerChoiceRef(choice.id, node)}
      style={{ fontSize: "1rem", minHeight: "3.5rem" }}
      type="button"
    >
      {choice.text}
    </button>
  )
}
