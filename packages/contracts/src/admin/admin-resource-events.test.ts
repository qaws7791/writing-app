import { describe, expect, it } from "vitest"

import { adminResourceEventSchema } from "@workspace/contracts/admin/admin-resource-events"

describe("자료실 실시간 이벤트 계약", () => {
  it("트리 변경 revision과 영향받은 부모를 파싱한다", () => {
    expect(
      adminResourceEventSchema.parse({
        action: "trash",
        affectedParentIds: ["folder-1", null],
        nodeId: "document-1",
        revision: 7,
        type: "resource-tree-mutated",
      })
    ).toMatchObject({ action: "trash", revision: 7 })
  })

  it("문서 제목 확정 이벤트를 트리 이벤트와 구분한다", () => {
    expect(
      adminResourceEventSchema.parse({
        documentId: "document-1",
        name: "운영 안내",
        revision: 8,
        type: "resource-document-title-confirmed",
      })
    ).toMatchObject({ name: "운영 안내" })
  })
})
