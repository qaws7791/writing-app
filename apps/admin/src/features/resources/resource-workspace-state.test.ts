import { beforeEach, describe, expect, it } from "vitest"

import {
  mergeExpandedResourceIds,
  readExpandedResourceIds,
  writeExpandedResourceIds,
} from "@/features/resources/resource-workspace-state"
import { adminIdSchema } from "@/lib/api/admin-identity"

const adminId = adminIdSchema.parse("admin-1")

describe("자료실 workspace 상태", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("관리자와 active·trash 범위별로 펼친 폴더 ID만 저장한다", () => {
    writeExpandedResourceIds(window.localStorage, adminId, "active", [
      "folder-1",
      "folder-1",
      "folder-2",
    ])
    writeExpandedResourceIds(window.localStorage, adminId, "trash", [
      "trash-folder",
    ])

    expect(
      readExpandedResourceIds(window.localStorage, adminId, "active")
    ).toEqual(["folder-1", "folder-2"])
    expect(
      readExpandedResourceIds(window.localStorage, adminId, "trash")
    ).toEqual(["trash-folder"])
    expect(
      readExpandedResourceIds(
        window.localStorage,
        adminIdSchema.parse("admin-2"),
        "active"
      )
    ).toEqual([])
  })

  it("손상된 저장 값은 빈 상태로 격리하고 경로 확장은 중복 없이 합친다", () => {
    window.localStorage.setItem(
      "writing-app:resource-library:expanded:v1:admin-1:active",
      "{invalid"
    )

    expect(
      readExpandedResourceIds(window.localStorage, adminId, "active")
    ).toEqual([])
    expect(
      mergeExpandedResourceIds(["folder-1"], ["folder-1", "folder-2"])
    ).toEqual(["folder-1", "folder-2"])
  })
})
