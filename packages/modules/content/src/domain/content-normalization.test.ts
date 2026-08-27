import { describe, expect, it } from "vitest"

import { normalizeVersionedStepContentOrThrow } from "#content/domain/content-normalization"

describe("시드 스텝 정규화", () => {
  it("SENTENCE_BUILD의 표시 문자열 정답을 생성된 타일 ID로 바꾼다", () => {
    const normalized = normalizeVersionedStepContentOrThrow(
      "lesson-1-s1",
      "SENTENCE_BUILD",
      JSON.stringify({
        correct: ["나는", "쓴다"],
        explanation: "방해 타일을 뺍니다.",
        question: "어절을 모아 문장을 만드세요.",
        tiles: ["나는", "아주", "쓴다"],
        type: "sentence_build",
      })
    )

    expect(JSON.parse(normalized)).toMatchObject({
      correct: ["lesson-1-s1:tile:1", "lesson-1-s1:tile:3"],
      tileIds: [
        "lesson-1-s1:tile:1",
        "lesson-1-s1:tile:2",
        "lesson-1-s1:tile:3",
      ],
    })
  })

  it("ERROR_CORRECT의 표시 문자열 정답을 구간 ID와 교정안 ID로 바꾼다", () => {
    const normalized = normalizeVersionedStepContentOrThrow(
      "lesson-1-s2",
      "ERROR_CORRECT",
      JSON.stringify({
        correctFix: "사실과 사례를 들며",
        correctSegment: "주장을 되풀이하며",
        explanation: "구간과 교정안을 모두 맞혀야 합니다.",
        fixes: ["주장을 되풀이하며", "사실과 사례를 들며"],
        question: "오류 구간을 찾아 고치세요.",
        segments: ["근거는", "주장을 되풀이하며", "독자를 설득한다."],
        type: "error_correct",
      })
    )

    expect(JSON.parse(normalized)).toMatchObject({
      correctFix: "lesson-1-s2:fix:2",
      correctSegment: "lesson-1-s2:segment:2",
      fixIds: ["lesson-1-s2:fix:1", "lesson-1-s2:fix:2"],
      segmentIds: [
        "lesson-1-s2:segment:1",
        "lesson-1-s2:segment:2",
        "lesson-1-s2:segment:3",
      ],
    })
  })

  it("ERROR_CORRECT 정답이 어느 구간과도 맞지 않으면 거부한다", () => {
    expect(() =>
      normalizeVersionedStepContentOrThrow(
        "lesson-1-s3",
        "ERROR_CORRECT",
        JSON.stringify({
          correctFix: "사실과 사례를 들며",
          correctSegment: "없는 구간",
          explanation: "해설",
          fixes: ["주장을 되풀이하며", "사실과 사례를 들며"],
          question: "오류 구간을 찾아 고치세요.",
          segments: ["근거는", "주장을 되풀이하며"],
          type: "error_correct",
        })
      )
    ).toThrow("Invalid step content for lesson-1-s3")
  })
})
