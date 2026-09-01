import { describe, expect, it } from "vitest"

import { orderAdminPreviewItems } from "@/features/course-editor/model/learner-step-preview-presentation"
import {
  createAdminPreviewPresentationScope,
  orderLearnerStepItems,
} from "@workspace/contracts/learning/step-presentation-order"

describe("orderAdminPreviewItems", () => {
  it("학습자와 같은 HMAC 순열을 미리보기 범위로 적용한다", () => {
    const items = [
      { id: "opt1", text: "첫째" },
      { id: "opt2", text: "둘째" },
      { id: "opt3", text: "셋째" },
    ]
    const stepId = "step-preview-1"

    expect(orderAdminPreviewItems(items, stepId)).toEqual(
      orderLearnerStepItems(items, createAdminPreviewPresentationScope(stepId))
    )
  })

  it("정답 선행 구간이면 한 칸 돌린다", () => {
    const items = [
      { id: "w1", text: "권고" },
      { id: "w2", text: "명령" },
      { id: "w3", text: "지시" },
    ]
    const stepId = "step-preview-blank"
    const ordered = orderAdminPreviewItems(items, stepId)
    const prefix = ordered.slice(0, 2).map((item) => item.id)

    expect(
      orderAdminPreviewItems(items, stepId, prefix)
        .slice(0, 2)
        .map((item) => item.id)
    ).not.toEqual(prefix)
  })
})
