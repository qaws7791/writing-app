import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "bun:test"

import {
  findReintroducedDbInfrastructurePaths,
  removedDbInfrastructurePaths,
} from "#scripts/package-interface-tombstones"

const fixtureRoots: string[] = []

afterEach(() => {
  for (const fixtureRoot of fixtureRoots.splice(0)) {
    fs.rmSync(fixtureRoot, { force: true, recursive: true })
  }
})

describe("package interface tombstone", () => {
  it.each(removedDbInfrastructurePaths)(
    "%s 재도입을 거절한다",
    (removedPath) => {
      const fixtureRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "package-interface-tombstone-")
      )
      fixtureRoots.push(fixtureRoot)
      const absolutePath = path.join(fixtureRoot, removedPath)

      if (path.extname(removedPath) === "") {
        fs.mkdirSync(absolutePath, { recursive: true })
      } else {
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
        fs.writeFileSync(absolutePath, "fixture\n")
      }

      expect(findReintroducedDbInfrastructurePaths(fixtureRoot)).toEqual([
        removedPath,
      ])
    }
  )
})
