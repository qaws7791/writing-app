import { describe, expect, it } from "vitest"

import { classifyResourceEventRevision } from "@/features/resources/resource-events-client"

describe("자료실 실시간 이벤트 revision", () => {
  it.each([
    { current: null, expected: "gap", incoming: 1 },
    { current: 3, expected: "stale", incoming: 3 },
    { current: 3, expected: "stale", incoming: 2 },
    { current: 3, expected: "next", incoming: 4 },
    { current: 3, expected: "gap", incoming: 5 },
  ] as const)(
    "현재 $current에서 $incoming 수신을 $expected로 분류한다",
    ({ current, expected, incoming }) => {
      expect(classifyResourceEventRevision(current, incoming)).toBe(expected)
    }
  )
})
