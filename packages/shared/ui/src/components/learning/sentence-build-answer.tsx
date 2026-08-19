"use client"

import { useState } from "react"

import { StepBody, StepHeader, StepTitle } from "#ui/components/learning/step"
import {
  Token,
  TokenBank,
  TokenSentence,
  TokenSlot,
} from "#ui/components/learning/token"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export type SentenceBuildTile<TId extends string = string> = {
  readonly id: TId
  readonly text: string
}

export function SentenceBuildAnswer<TId extends string>({
  checked = false,
  correctTileIds,
  defaultSelectedTileIds = [],
  explanation: _explanation,
  onChange,
  prompt,
  tiles,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctTileIds: readonly TId[]
  readonly defaultSelectedTileIds?: readonly TId[]
  readonly explanation?: string
  readonly onChange?: (selectedTileIds: readonly TId[]) => void
  readonly prompt: string
  readonly tiles: readonly SentenceBuildTile<TId>[]
}) {
  const [selectedTileIds, setSelectedTileIds] = useState<readonly TId[]>(
    defaultSelectedTileIds
  )

  function emitChange(nextIds: readonly TId[]) {
    onChange?.(nextIds)
  }

  function handleAddTile(tileId: TId) {
    if (checked !== false) return
    if (selectedTileIds.includes(tileId)) return

    const nextIds = [...selectedTileIds, tileId]
    setSelectedTileIds(nextIds)
    emitChange(nextIds)
  }

  function handleRemoveAt(index: number) {
    if (checked !== false) return

    const nextIds = selectedTileIds.filter(
      (_, itemIndex) => itemIndex !== index
    )
    setSelectedTileIds(nextIds)
    emitChange(nextIds)
  }

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h1>{prompt}</h1>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <TokenSentence aria-label="조립한 문장">
          {selectedTileIds.length === 0 ? (
            <TokenSlot
              aria-label="문장 조립 영역, 비어 있음"
              disabled
              state={checked === false ? "empty" : "locked"}
            >
              타일을 배치하세요
            </TokenSlot>
          ) : (
            selectedTileIds.map((tileId, index) => {
              const tile = tiles.find((candidate) => candidate.id === tileId)
              const isCorrect = correctTileIds[index] === tileId
              const state =
                checked === false
                  ? "filled"
                  : isCorrect
                    ? "correct"
                    : "incorrect"

              return (
                <TokenSlot
                  aria-label={`${index + 1}번째 어절 ${tile?.text ?? tileId}, 선택 해제`}
                  disabled={checked !== false}
                  key={`${tileId}-${index}`}
                  onClick={() => handleRemoveAt(index)}
                  state={state}
                >
                  {tile?.text ?? tileId}
                </TokenSlot>
              )
            })
          )}
        </TokenSentence>
        <TokenBank aria-label="문장 타일">
          {tiles.map((tile) => {
            const used = selectedTileIds.includes(tile.id)
            return (
              <Token
                aria-pressed={used}
                disabled={used || checked !== false}
                key={tile.id}
                onClick={() => handleAddTile(tile.id)}
                state={used ? "used" : checked === false ? "idle" : "locked"}
              >
                {tile.text}
              </Token>
            )
          })}
        </TokenBank>
      </StepBody>
    </>
  )
}
