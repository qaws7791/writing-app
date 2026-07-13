import { describe, expect, it } from "vitest"

import { readUserStatusTransition } from "@/features/users/user-status-transition"

describe("readUserStatusTransition", () => {
  it("활성 사용자와 정지 사용자의 다음 상태를 반대로 매핑한다", () => {
    expect(readUserStatusTransition("active")).toMatchObject({
      label: "정지",
      targetStatus: "suspended",
    })
    expect(readUserStatusTransition("suspended")).toMatchObject({
      label: "활성화",
      targetStatus: "active",
    })
  })

  it("삭제 사용자는 상태 변경을 제공하지 않는다", () => {
    expect(readUserStatusTransition("deleted")).toBeNull()
  })
})
