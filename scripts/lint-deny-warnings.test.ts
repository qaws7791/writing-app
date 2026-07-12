import { describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

describe("제품 lint warning gate", () => {
  test("warning fixture도 deny-warnings에서 실패한다", async () => {
    const repositoryRoot = process.cwd()
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lint-warning-"))
    const fixturePath = path.join(fixtureRoot, "unused-variable.ts")
    fs.writeFileSync(fixturePath, "const unusedValue = 1\n")

    try {
      const child = Bun.spawn(
        [
          "bunx",
          "oxlint",
          fixturePath,
          "--config",
          path.join(repositoryRoot, ".oxlintrc.json"),
          "--deny-warnings",
        ],
        {
          cwd: repositoryRoot,
          stderr: "pipe",
          stdout: "pipe",
        }
      )
      const [exitCode, output, errorOutput] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ])

      expect(exitCode).not.toBe(0)
      expect(`${output}\n${errorOutput}`).toContain("unusedValue")
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true })
    }
  })
})
