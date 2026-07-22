import { describe, expect, it } from "vitest"

import { buttonVariants } from "#ui/components/ui/button"

describe("buttonVariants", () => {
  it("공통 상호작용 상태를 제공한다", () => {
    const classes = buttonVariants()

    expect(classes).toContain("focus-visible:ring-3")
    expect(classes).toContain("disabled:pointer-events-none")
    expect(classes).toContain(
      "[&:active:not(:disabled):not([aria-haspopup='true']):not([aria-expanded='true'])]:[transform:scale(var(--motion-press-scale))]"
    )
  })

  it("호출부 className이 기본 크기와 모양을 재정의한다", () => {
    const classes = buttonVariants({
      className: "h-auto rounded-full px-2",
      size: "default",
    })

    expect(classes).toContain("h-auto")
    expect(classes).toContain("rounded-full")
    expect(classes).toContain("px-2")
    expect(classes).not.toContain("h-11")
    expect(classes).not.toContain("rounded-4xl")
    expect(classes).not.toContain("px-5")
  })
})
