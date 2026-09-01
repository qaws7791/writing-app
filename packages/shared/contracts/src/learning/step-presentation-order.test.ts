import { describe, expect, it } from "vitest"

import { hmacSha256Hex } from "#contracts/learning/hmac-sha256"
import {
  createAdminPreviewPresentationScope,
  createLearnerStepPresentationScope,
  orderLearnerStepItems,
  orderLearnerStepItemsAvoidingPrefix,
  rotateLeftIfPrefixMatches,
} from "#contracts/learning/step-presentation-order"

describe("hmacSha256Hex", () => {
  it("RFC 4231과 긴 키 HMAC-SHA256이 맞다", () => {
    expect(hmacSha256Hex("Jefe", "what do ya want for nothing?")).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"
    )
    expect(hmacSha256Hex("", "")).toBe(
      "b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad"
    )
    expect(hmacSha256Hex("a".repeat(80), "opt1")).toBe(
      "1e06dd59798542c080af1efd1b016e0806068f73b319c8033b3247c1de432b0c"
    )
  })
})

describe("orderLearnerStepItems", () => {
  it("HMAC digest 오름차순으로 항목을 정렬한다", () => {
    const items = [{ id: "opt1" }, { id: "opt2" }, { id: "opt3" }]
    const scope = "lesson-scope"
    const expected = [...items].sort((left, right) => {
      const leftKey = hmacSha256Hex(scope, left.id)
      const rightKey = hmacSha256Hex(scope, right.id)
      return leftKey.localeCompare(rightKey) || left.id.localeCompare(right.id)
    })

    expect(orderLearnerStepItems(items, scope)).toEqual(expected)
  })
})

describe("rotateLeftIfPrefixMatches", () => {
  it("선행 구간이 정답이면 한 칸 왼쪽으로 돌린다", () => {
    expect(
      rotateLeftIfPrefixMatches(
        [{ id: "t1" }, { id: "t2" }, { id: "t3" }, { id: "t4" }],
        ["t1", "t2", "t3"]
      ).map((item) => item.id)
    ).toEqual(["t2", "t3", "t4", "t1"])
  })

  it("선행 구간이 정답이 아니면 순서를 유지한다", () => {
    const items = [{ id: "t2" }, { id: "t1" }, { id: "t3" }]
    expect(rotateLeftIfPrefixMatches(items, ["t1", "t2"])).toEqual(items)
  })
})

describe("orderLearnerStepItemsAvoidingPrefix", () => {
  it("정렬 결과가 정답 선행 구간이면 한 칸 돌린다", () => {
    const items = [{ id: "w1" }, { id: "w2" }, { id: "w3" }, { id: "w4" }]
    const scope = "fill-blank-scope"
    const ordered = orderLearnerStepItems(items, scope)
    const correctIds = ordered.slice(0, 2).map((item) => item.id)

    expect(
      orderLearnerStepItemsAvoidingPrefix(items, scope, correctIds)
        .slice(0, 2)
        .map((item) => item.id)
    ).not.toEqual(correctIds)
  })
})

describe("presentation scope", () => {
  it("학습자 범위와 미리보기 범위를 구분한다", () => {
    expect(
      createLearnerStepPresentationScope({
        learnerScope: "learner-a",
        lessonId: "lesson-1",
        stepId: "step-1",
        versionId: "version-1",
      })
    ).toBe("learner-a:version-1:lesson-1:step-1")
    expect(createAdminPreviewPresentationScope("step-1")).toBe(
      "admin-preview:step-1"
    )
  })
})
