import { afterEach, describe, expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { acquireSetupLock } from "#scripts/setup"

const temporaryDirectories: string[] = []

afterEach(async () => {
  for (const directory of temporaryDirectories.splice(0)) {
    await rm(directory, { force: true, recursive: true })
  }
})

describe("local setup operation lock", () => {
  test("동시 setup을 차단하고 소유자가 해제한 뒤 다시 획득한다", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "writing-app-setup-lock-"))
    temporaryDirectories.push(root)

    const firstLock = acquireSetupLock(root)
    expect(() => acquireSetupLock(root)).toThrow("다른 setup이 실행 중")

    firstLock.release()
    expect(existsSync(path.join(root, "data", ".setup.lock"))).toBe(false)

    const secondLock = acquireSetupLock(root)
    secondLock.release()
  })
})
