import { describe, expect, it } from "vitest"

import {
  createMatchInteractionState,
  createMatchStepPresentation,
  toMatchAnswerConnections,
  toMatchAnswerPairs,
  transitionMatchChoiceSelection,
  toggleMatchSelection,
  type MatchChoice,
  type MatchSelectionMap,
  type MatchStepPresentation,
} from "@/features/lesson-session/model/lesson-match-presentation"

describe("매칭 step 상호작용 정책", () => {
  it("같은 pair를 다시 선택하면 연결을 해제한다", () => {
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
      { id: leftChoice.id, side: "left" }
    )
    const connected = transitionMatchChoiceSelection(pending.state, {
      id: rightChoice.id,
      side: "right",
    })
    const pendingAgain = transitionMatchChoiceSelection(connected.state, {
      id: leftChoice.id,
      side: "left",
    })
    const disconnected = transitionMatchChoiceSelection(pendingAgain.state, {
      id: rightChoice.id,
      side: "right",
    })

    expect(disconnected.state.selectionMap[leftChoice.id]).toBeUndefined()
  })

  it("중복 label에서도 저장 payload는 선택한 콘텐츠 item ID를 보존한다", () => {
    const presentation = createDuplicateLabelPresentation()
    const firstLeft = readChoiceByItemId(
      presentation.leftChoices,
      "left-item-1"
    )
    const secondRight = readChoiceByItemId(
      presentation.rightChoices,
      "right-item-2"
    )
    const selectionMap = toggleMatchSelection(emptySelectionMap(), {
      leftChoiceId: firstLeft.id,
      rightChoiceId: secondRight.id,
    })

    expect(toMatchAnswerPairs(presentation, selectionMap)).toEqual([
      {
        left: "문장 A",
        leftItemId: "left-item-1",
        right: "강조",
        rightItemId: "right-item-2",
      },
    ])
  })

  it("연결의 정오답 tone은 server evaluation만 따른다", () => {
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
