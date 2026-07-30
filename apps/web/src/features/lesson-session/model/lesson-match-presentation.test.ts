import { describe, expect, it } from "vitest"

import {
  createMatchInteractionState,
  createMatchStepPresentation,
  findMatchedLeftChoiceIdForRightChoiceId,
  toMatchAnswerConnections,
  toMatchAnswerPairs,
  transitionMatchChoiceSelection,
  toggleMatchSelection,
  type MatchChoice,
  type MatchSelectionMap,
  type MatchStepPresentation,
} from "@/features/lesson-session/model/lesson-match-presentation"

describe("매칭 스텝 표시와 상호작용 정책", () => {
  it("오른쪽 선택지 순서는 같은 입력에서 결정적으로 고정한다", () => {
    const first = createPresentation([
      { left: "도입", right: "관심" },
      { left: "전개", right: "근거" },
      { left: "마무리", right: "정리" },
    ])
    const second = createPresentation([
      { left: "도입", right: "관심" },
      { left: "전개", right: "근거" },
      { left: "마무리", right: "정리" },
    ])

    expect(first.rightChoices.map((choice) => choice.itemId)).toEqual(
      second.rightChoices.map((choice) => choice.itemId)
    )
  })

  it("중복 텍스트 선택지도 콘텐츠 item마다 서로 다른 choice id를 부여한다", () => {
    const presentation = createDuplicateLabelPresentation()
    const firstRight = readChoiceByItemId(
      presentation.rightChoices,
      "right-item-1"
    )
    const secondRight = readChoiceByItemId(
      presentation.rightChoices,
      "right-item-2"
    )

    expect(firstRight.text).toBe(secondRight.text)
    expect(firstRight.id).not.toBe(secondRight.id)
  })

  it("오른쪽 선택지는 하나의 왼쪽 선택지에만 배정한다", () => {
    const presentation = createPresentation([
      { left: "간결함", right: "짧게" },
      { left: "정확함", right: "분명하게" },
    ])
    const firstLeft = readChoiceByItemId(
      presentation.leftChoices,
      "left-item-1"
    )
    const secondLeft = readChoiceByItemId(
      presentation.leftChoices,
      "left-item-2"
    )
    const firstRight = readChoiceByItemId(
      presentation.rightChoices,
      "right-item-1"
    )

    const firstSelection = toggleMatchSelection(emptySelectionMap(), {
      leftChoiceId: firstLeft.id,
      rightChoiceId: firstRight.id,
    })
    const reassignedSelection = toggleMatchSelection(firstSelection, {
      leftChoiceId: secondLeft.id,
      rightChoiceId: firstRight.id,
    })

    expect(reassignedSelection[firstLeft.id]).toBeUndefined()
    expect(reassignedSelection[secondLeft.id]).toBe(firstRight.id)
    expect(
      findMatchedLeftChoiceIdForRightChoiceId(
        reassignedSelection,
        firstRight.id
      )
    ).toBe(secondLeft.id)
  })

  it("같은 짝을 다시 선택하면 해당 배정을 해제한다", () => {
    const presentation = createPresentation([
      { left: "원인", right: "결과를 만든다" },
    ])
    const leftChoice = readChoiceByItemId(
      presentation.leftChoices,
      "left-item-1"
    )
    const rightChoice = readChoiceByItemId(
      presentation.rightChoices,
      "right-item-1"
    )

    const selected = toggleMatchSelection(emptySelectionMap(), {
      leftChoiceId: leftChoice.id,
      rightChoiceId: rightChoice.id,
    })
    const unselected = toggleMatchSelection(selected, {
      leftChoiceId: leftChoice.id,
      rightChoiceId: rightChoice.id,
    })

    expect(unselected[leftChoice.id]).toBeUndefined()
  })

  it("저장 payload는 학습 콘텐츠의 stable item ID와 표시 텍스트로 만든다", () => {
    const presentation = createPresentation([
      { left: "그러나", right: "역접" },
      { left: "따라서", right: "결론" },
    ])
    const leftChoice = readChoiceByItemId(
      presentation.leftChoices,
      "left-item-1"
    )
    const rightChoice = readChoiceByItemId(
      presentation.rightChoices,
      "right-item-1"
    )

    const selectionMap = toggleMatchSelection(emptySelectionMap(), {
      leftChoiceId: leftChoice.id,
      rightChoiceId: rightChoice.id,
    })

    expect(toMatchAnswerPairs(presentation, selectionMap)).toEqual([
      {
        left: "그러나",
        leftItemId: "left-item-1",
        right: "역접",
        rightItemId: "right-item-1",
      },
    ])
  })

  it("server evaluation이 없으면 연결선을 기본 tone으로 표시한다", () => {
    const presentation = createDuplicateLabelPresentation()
    const firstLeft = readChoiceByItemId(
      presentation.leftChoices,
      "left-item-1"
    )
    const secondRight = readChoiceByItemId(
      presentation.rightChoices,
      "right-item-2"
    )

    expect(
      toMatchAnswerConnections(presentation, { [firstLeft.id]: secondRight.id })
    ).toEqual([
      {
        leftChoiceId: firstLeft.id,
        rightChoiceId: secondRight.id,
        tone: "default",
      },
    ])
  })

  it("정오답 표시는 client pair 순서가 아니라 server evaluation만 따른다", () => {
    const presentation = createDuplicateLabelPresentation()
    const firstLeft = readChoiceByItemId(
      presentation.leftChoices,
      "left-item-1"
    )
    const secondRight = readChoiceByItemId(
      presentation.rightChoices,
      "right-item-2"
    )

    expect(
      toMatchAnswerConnections(
        presentation,
        { [firstLeft.id]: secondRight.id },
        [
          {
            leftItemId: firstLeft.itemId,
            rightItemId: secondRight.itemId,
            verdict: "incorrect",
          },
        ]
      )
    ).toEqual([
      {
        leftChoiceId: firstLeft.id,
        rightChoiceId: secondRight.id,
        tone: "wrong",
      },
    ])
  })

  it("양쪽 선택 순서와 같은 항목 재선택을 web interaction state로 전이한다", () => {
    const presentation = createPresentation([{ left: "원인", right: "결과" }])
    const leftChoice = readChoiceByItemId(
      presentation.leftChoices,
      "left-item-1"
    )
    const rightChoice = readChoiceByItemId(
      presentation.rightChoices,
      "right-item-1"
    )

    const pending = transitionMatchChoiceSelection(
      createMatchInteractionState(),
      { id: rightChoice.id, side: "right" }
    )
    const connected = transitionMatchChoiceSelection(pending.state, {
      id: leftChoice.id,
      side: "left",
    })
    const pendingAgain = transitionMatchChoiceSelection(connected.state, {
      id: leftChoice.id,
      side: "left",
    })
    const disconnected = transitionMatchChoiceSelection(pendingAgain.state, {
      id: rightChoice.id,
      side: "right",
    })

    expect(pending.type).toBe("pending-changed")
    expect(connected.type).toBe("answer-changed")
    expect(connected.state.selectionMap[leftChoice.id]).toBe(rightChoice.id)
    expect(disconnected.type).toBe("answer-changed")
    expect(disconnected.state.selectionMap[leftChoice.id]).toBeUndefined()
  })
})

function emptySelectionMap(): MatchSelectionMap {
  return {}
}

function createDuplicateLabelPresentation(): MatchStepPresentation {
  return createPresentation([
    { left: "문장 A", right: "강조" },
    { left: "문장 B", right: "강조" },
  ])
}

function createPresentation(
  pairs: readonly { readonly left: string; readonly right: string }[]
): MatchStepPresentation {
  return createMatchStepPresentation({
    leftItems: pairs.map((pair, index) => ({
      id: `left-item-${index + 1}`,
      text: pair.left,
    })),
    rightItems: pairs.map((pair, index) => ({
      id: `right-item-${index + 1}`,
      text: pair.right,
    })),
  })
}

function readChoiceByItemId(
  choices: readonly MatchChoice[],
  itemId: string
): MatchChoice {
  const choice = choices.find((candidate) => candidate.itemId === itemId)

  if (choice === undefined) {
    throw new Error(`매칭 선택지 fixture에 ${itemId}가 없습니다.`)
  }

  return choice
}
