import { describe, expect, it } from "vitest"

import {
  createMatchStepPresentation,
  findMatchedLeftChoiceIdForRightChoiceId,
  isCorrectMatchChoice,
  toMatchAnswerPairs,
  toggleMatchSelection,
  type MatchSelectionMap,
} from "@/features/lessons/lesson-match-presentation"

describe("매칭 스텝 표시와 상호작용 정책", () => {
  it("오른쪽 선택지 순서는 같은 입력에서 결정적으로 고정한다", () => {
    const first = createMatchStepPresentation({
      pairs: [
        { left: "도입", right: "관심" },
        { left: "전개", right: "근거" },
        { left: "마무리", right: "정리" },
      ],
    })
    const second = createMatchStepPresentation({
      pairs: [
        { left: "도입", right: "관심" },
        { left: "전개", right: "근거" },
        { left: "마무리", right: "정리" },
      ],
    })

    expect(first.rightChoices.map((choice) => choice.id)).toEqual(
      second.rightChoices.map((choice) => choice.id)
    )
  })

  it("중복 텍스트도 stable choice id로 구분한다", () => {
    const presentation = createMatchStepPresentation({
      pairs: [
        { left: "문장 A", right: "강조" },
        { left: "문장 B", right: "강조" },
      ],
    })

    expect(presentation.leftChoices.map((choice) => choice.id)).toEqual([
      "left-1",
      "left-2",
    ])
    expect(presentation.rightChoices.map((choice) => choice.id).sort()).toEqual(
      ["right-1", "right-2"]
    )
  })

  it("오른쪽 선택지는 하나의 왼쪽 선택지에만 배정한다", () => {
    const presentation = createMatchStepPresentation({
      pairs: [
        { left: "간결함", right: "짧게" },
        { left: "정확함", right: "분명하게" },
      ],
    })
    const [firstLeft, secondLeft] = presentation.leftChoices
    const firstRight = presentation.rightChoices.find(
      (choice) => choice.id === "right-1"
    )

    if (
      firstLeft === undefined ||
      secondLeft === undefined ||
      firstRight === undefined
    ) {
      throw new Error("테스트 매칭 선택지가 준비되지 않았습니다.")
    }

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
    const presentation = createMatchStepPresentation({
      pairs: [{ left: "원인", right: "결과를 만든다" }],
    })
    const leftChoice = presentation.leftChoices[0]
    const rightChoice = presentation.rightChoices[0]

    if (leftChoice === undefined || rightChoice === undefined) {
      throw new Error("테스트 매칭 선택지가 준비되지 않았습니다.")
    }

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

  it("저장 payload는 stable id가 아니라 학습 콘텐츠 텍스트로 만든다", () => {
    const presentation = createMatchStepPresentation({
      pairs: [
        { left: "그러나", right: "역접" },
        { left: "따라서", right: "결론" },
      ],
    })
    const leftChoice = presentation.leftChoices[0]
    const rightChoice = presentation.rightChoices.find(
      (choice) => choice.id === "right-1"
    )

    if (leftChoice === undefined || rightChoice === undefined) {
      throw new Error("테스트 매칭 선택지가 준비되지 않았습니다.")
    }

    const selectionMap = toggleMatchSelection(emptySelectionMap(), {
      leftChoiceId: leftChoice.id,
      rightChoiceId: rightChoice.id,
    })

    expect(toMatchAnswerPairs(presentation, selectionMap)).toEqual([
      { left: "그러나", right: "역접" },
    ])
  })

  it("정답 여부는 표시 텍스트가 아니라 choice id pair로 판정한다", () => {
    const presentation = createMatchStepPresentation({
      pairs: [
        { left: "문장 A", right: "강조" },
        { left: "문장 B", right: "강조" },
      ],
    })
    const firstLeft = presentation.leftChoices[0]
    const secondRight = presentation.rightChoices.find(
      (choice) => choice.id === "right-2"
    )

    if (firstLeft === undefined || secondRight === undefined) {
      throw new Error("테스트 매칭 선택지가 준비되지 않았습니다.")
    }

    expect(
      isCorrectMatchChoice(presentation, firstLeft.id, secondRight.id)
    ).toBe(false)
  })
})

function emptySelectionMap(): MatchSelectionMap {
  return {}
}
