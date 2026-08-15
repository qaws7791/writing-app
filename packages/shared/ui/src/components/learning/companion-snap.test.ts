import { describe, expect, it } from "vitest"

import {
  companionSnapFromPoint,
  nearestCompanionSnap,
  stepCompanionSnap,
} from "./companion-snap"

describe("companion snap", () => {
  it("가까운 스냅으로 붙인다", () => {
    expect(nearestCompanionSnap(0.24)).toBe("compact")
    expect(nearestCompanionSnap(0.3)).toBe("compact")
    expect(nearestCompanionSnap(0.4)).toBe("split")
    expect(nearestCompanionSnap(0.55)).toBe("split")
    expect(nearestCompanionSnap(0.75)).toBe("read")
  })

  it("Drawer snap point를 스냅 이름으로 바꾼다", () => {
    expect(companionSnapFromPoint(0.24)).toBe("compact")
    expect(companionSnapFromPoint(0.4)).toBe("split")
    expect(companionSnapFromPoint(0.75)).toBe("read")
    expect(companionSnapFromPoint(null)).toBe("split")
  })

  it("한 단계만 올리거나 내린다", () => {
    expect(stepCompanionSnap("compact", 1)).toBe("split")
    expect(stepCompanionSnap("split", 1)).toBe("read")
    expect(stepCompanionSnap("read", 1)).toBe("read")
    expect(stepCompanionSnap("read", -1)).toBe("split")
    expect(stepCompanionSnap("compact", -1)).toBe("compact")
  })
})
