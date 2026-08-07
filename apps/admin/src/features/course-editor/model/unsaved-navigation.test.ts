import { describe, expect, it } from "vitest"

import { shouldConfirmUnsavedNavigation } from "@/features/course-editor/model/unsaved-navigation"

const noModifiers = {
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
} as const

describe("shouldConfirmUnsavedNavigation", () => {
  it("저장하지 않은 변경이 있는 평범한 클릭은 이동 확인을 묻는다", () => {
    expect(
      shouldConfirmUnsavedNavigation({ modifiers: noModifiers, unsaved: true })
    ).toBe(true)
  })

  it("저장하지 않은 변경이 없으면 이동 확인을 묻지 않는다", () => {
    expect(
      shouldConfirmUnsavedNavigation({ modifiers: noModifiers, unsaved: false })
    ).toBe(false)
  })

  it.each(["ctrlKey", "metaKey"] as const)(
    "%s 수정키 클릭은 저장하지 않은 변경이 있어도 브라우저 기본 동작에 맡긴다",
    (modifier) => {
      expect(
        shouldConfirmUnsavedNavigation({
          modifiers: { ...noModifiers, [modifier]: true },
          unsaved: true,
        })
      ).toBe(false)
    }
  )
})
