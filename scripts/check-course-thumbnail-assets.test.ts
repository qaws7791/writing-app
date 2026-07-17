import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { courseVisualKeyValues } from "@workspace/contracts/content"

import { validateCourseThumbnailAssets } from "./check-course-thumbnail-assets"

describe("코스 썸네일 build-time 동기화", () => {
  let repositoryRoot = ""

  beforeEach(async () => {
    repositoryRoot = await mkdtemp(path.join(os.tmpdir(), "thumbnail-assets-"))
    await Promise.all(
      ["apps/web", "apps/admin"].map((appPath) =>
        mkdir(
          path.join(repositoryRoot, appPath, "public", "course-thumbnails"),
          { recursive: true }
        )
      )
    )

    await Promise.all(
      courseVisualKeyValues.flatMap((visualKey) =>
        ["apps/web", "apps/admin"].map((appPath) =>
          writeFile(
            path.join(
              repositoryRoot,
              appPath,
              "public",
              "course-thumbnails",
              `${visualKey}.png`
            ),
            visualKey
          )
        )
      )
    )
  })

  afterEach(async () => {
    await rm(repositoryRoot, { force: true, recursive: true })
  })

  test("CourseVisualKey 파일 집합과 byte가 같으면 통과한다", async () => {
    expect(await validateCourseThumbnailAssets(repositoryRoot)).toEqual([])
  })

  test("추가 파일과 canonical hash 차이를 모두 보고한다", async () => {
    const adminDirectory = path.join(
      repositoryRoot,
      "apps",
      "admin",
      "public",
      "course-thumbnails"
    )
    await Promise.all([
      writeFile(path.join(adminDirectory, "unexpected.png"), "unexpected"),
      writeFile(
        path.join(adminDirectory, "basic-sentence-writing.png"),
        "changed"
      ),
    ])

    const errors = await validateCourseThumbnailAssets(repositoryRoot)

    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain("정확히 같아야")
    expect(errors[1]).toContain("hash가 다릅니다")
  })
})
