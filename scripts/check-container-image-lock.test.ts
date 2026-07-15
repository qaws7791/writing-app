import { describe, expect, test } from "bun:test"
import fs from "node:fs"
import path from "node:path"

import {
  parseContainerImageLock,
  validateContainerImageLock,
} from "./check-container-image-lock"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const lock = parseContainerImageLock(
  JSON.parse(
    fs.readFileSync(
      path.join(
        repositoryRoot,
        "deploy",
        "security",
        "container-image-lock.json"
      ),
      "utf8"
    )
  ) as unknown
)

describe("container image lock", () => {
  test("모든 base와 운영 image가 tag와 digest로 고정된다", () => {
    expect(
      validateContainerImageLock(lock, (relativePath) =>
        fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8")
      )
    ).toEqual([])
  })

  test("고정 digest 누락과 tag-only 회귀를 거부한다", () => {
    const target = lock.images[0]
    if (target === undefined) throw new Error("fixture image가 없습니다.")
    const mutableReference = target.reference.split("@sha256:")[0] ?? ""

    expect(
      validateContainerImageLock(lock, (relativePath) => {
        const source = fs.readFileSync(
          path.join(repositoryRoot, relativePath),
          "utf8"
        )
        return relativePath === target.uses[0]
          ? source.replace(target.reference, mutableReference)
          : source
      })
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("고정 reference가 없습니다"),
        expect.stringContaining("tag-only reference가 있습니다"),
      ])
    )
  })
})
