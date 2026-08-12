"use client"

import { useState } from "react"

import {
  Segment,
  SegmentGroup,
  type SegmentState,
} from "#ui/components/learning/segment"
import {
  Sortable,
  SortableContent,
  SortableHandle,
  SortableIndex,
  SortableItem,
} from "#ui/components/learning/sortable"
import { StepBody, StepHeader, StepTitle } from "#ui/components/learning/step"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export type ParagraphOrganizeCard<TId extends string = string> = {
  readonly id: TId
  readonly text: string
}

export function ParagraphOrganizeAnswer<TId extends string>({
  cards,
  checked = false,
  correctCardIds,
  defaultSelectedCardIds = [],
  explanation: _explanation,
  onChange,
  prompt,
}: {
  readonly cards: readonly ParagraphOrganizeCard<TId>[]
  readonly checked?: LessonStepCheckedVisual
  readonly correctCardIds: readonly TId[]
  readonly defaultSelectedCardIds?: readonly TId[]
  readonly explanation?: string
  readonly onChange?: (selectedCardIds: readonly TId[]) => void
  readonly prompt?: string
}) {
  const [selectedCardIds, setSelectedCardIds] = useState<readonly TId[]>(
    defaultSelectedCardIds
  )

  function emitChange(nextIds: readonly TId[]) {
    onChange?.(nextIds)
  }

  function toggleCard(cardId: TId) {
    if (checked !== false) return

    const nextIds = selectedCardIds.includes(cardId)
      ? selectedCardIds.filter((id) => id !== cardId)
      : [...selectedCardIds, cardId]
    setSelectedCardIds(nextIds)
    emitChange(nextIds)
  }

  function cardPoolState(cardId: TId): SegmentState {
    const isSelected = selectedCardIds.includes(cardId)
    if (checked === false) return isSelected ? "selected" : "idle"

    const belongsInAnswer = correctCardIds.includes(cardId)
    if (belongsInAnswer && isSelected) return "correct"
    if (belongsInAnswer && !isSelected) return "missed"
    if (!belongsInAnswer && isSelected) return "incorrect"
    return "locked"
  }

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>{prompt ?? "문단에 넣을 문장을 고르고 순서를 맞추세요"}</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            문장 카드에서 포함할 문장을 고르세요
          </p>
          <SegmentGroup aria-label="문장 카드" layout="block">
            {cards.map((card) => (
              <Segment
                disabled={checked !== false}
                key={card.id}
                layout="block"
                onClick={() => toggleCard(card.id)}
                selected={selectedCardIds.includes(card.id)}
                state={cardPoolState(card.id)}
              >
                {card.text}
              </Segment>
            ))}
          </SegmentGroup>
        </div>
        {selectedCardIds.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              선택한 문장 순서를 조정하세요
            </p>
            <Sortable
              aria-label="문단 문장 순서"
              disabled={checked !== false}
              getItemLabel={(itemId) =>
                cards.find((card) => card.id === itemId)?.text ?? itemId
              }
              onValueChange={(nextIds) => {
                const allowed = new Set(selectedCardIds)
                const nextSelected = nextIds.filter((id): id is TId =>
                  allowed.has(id as TId)
                )
                if (nextSelected.length === selectedCardIds.length) {
                  setSelectedCardIds(nextSelected)
                  emitChange(nextSelected)
                }
              }}
              value={[...selectedCardIds]}
            >
              {selectedCardIds.map((cardId, index) => {
                const card = cards.find((candidate) => candidate.id === cardId)
                const isCorrect = correctCardIds[index] === cardId

                return (
                  <SortableItem
                    key={cardId}
                    state={
                      checked === false
                        ? "idle"
                        : isCorrect
                          ? "correct"
                          : "incorrect"
                    }
                    value={cardId}
                  >
                    <SortableIndex />
                    <SortableContent>{card?.text ?? cardId}</SortableContent>
                    <SortableHandle />
                  </SortableItem>
                )
              })}
            </Sortable>
          </div>
        ) : null}
      </StepBody>
    </>
  )
}
