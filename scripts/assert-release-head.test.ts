import { describe, expect, test } from "bun:test"

import { assertReleaseIsCurrentMain } from "#scripts/assert-release-head"

const releaseRevision = "a".repeat(40)
const validInput = {
  apiUrl: "https://api.github.com",
  releaseRevision,
  repository: "acme/writing-app",
  token: "github-actions-token",
} as const

describe("production release main head", () => {
  test("release revision이 현재 main보다 오래됐으면 fail-closed한다", async () => {
    const currentMainRevision = "b".repeat(40)

    await expect(
      assertReleaseIsCurrentMain(validInput, () =>
        Promise.resolve(
          Response.json({
            object: { sha: currentMainRevision, type: "commit" },
            ref: "refs/heads/main",
          })
        )
      )
    ).rejects.toThrow(`현재 main ${currentMainRevision}`)
  })

  test("GitHub API 503 응답을 승인으로 바꾸지 않는다", async () => {
    await expect(
      assertReleaseIsCurrentMain(validInput, () =>
        Promise.resolve(new Response("unavailable", { status: 503 }))
      )
    ).rejects.toThrow("HTTP 503")
  })
})
