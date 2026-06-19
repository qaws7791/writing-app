import { describe, expect, it } from "vitest"

import {
  readStepContent,
  type EditorStep,
} from "@/features/courses/course-editor/step-form-contract"

describe("course editor step form registry", () => {
  it("contentJson이 배열이면 손상된 데이터로 보고 예외를 던진다", () => {
    expect(() =>
      readStepContent({
        contentJson: "[]",
        id: "step-1",
        sortOrder: 1,
        status: "active",
        type: "WRITE",
      } as EditorStep)
    ).toThrow("레슨 스텝 contentJson은 객체여야 합니다.")
  })
})
