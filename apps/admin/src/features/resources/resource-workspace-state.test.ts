import { beforeEach, describe, expect, it } from "vitest"

import {
  mergeExpandedResourceIds,
  readExpandedResourceIds,
  writeExpandedResourceIds,
} from "@/features/resources/resource-workspace-state"

describe("자료실 workspace 상태", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("관리자와 active·trash 범위별로 펼친 폴더 ID만 저장한다", () => {
    writeExpandedResourceIds(window.localStorage, "admin-1", "active", [
      "folder-1",
      "folder-1",
      "folder-2",
    ])
    writeExpandedResourceIds(window.localStorage, "admin-1", "trash", [
      "trash-folder",
    ])

    expect(
      readExpandedResourceIds(window.localStorage, "admin-1", "active")
    ).toEqual(["folder-1", "folder-2"])
    expect(
      readExpandedResourceIds(window.localStorage, "admin-1", "trash")
    ).toEqual(["trash-folder"])
    expect(
      readExpandedResourceIds(window.localStorage, "admin-2", "active")
    ).toEqual([])
  })

  it("손상된 저장 값은 빈 상태로 격리하고 경로 확장은 중복 없이 합친다", () => {
    window.localStorage.setItem(
      "writing-app:resource-library:expanded:v1:admin-1:active",
      "{invalid"
    )

    expect(
      readExpandedResourceIds(window.localStorage, "admin-1", "active")
    ).toEqual([])
    expect(
      mergeExpandedResourceIds(["folder-1"], ["folder-1", "folder-2"])
    ).toEqual(["folder-1", "folder-2"])
  })
})
