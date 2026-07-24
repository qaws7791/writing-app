import { describe, expect, test } from "bun:test"

import { assertReleaseIsCurrentMain } from "#scripts/assert-release-head"

const revision = "a".repeat(40)
const validInput = {
  apiUrl: "https://api.github.com",
  releaseRevision: revision,
  repository: "acme/writing-app",
  token: "github-actions-token",
} as const

describe("production release main head", () => {
  test("authenticated GitHub main commit과 release revision이 같으면 승인한다", async () => {
    const requests: Array<{ init?: RequestInit; url: string }> = []
    const fetchImplementation = async (
      input: string | URL | Request,
      init?: RequestInit
    ): Promise<Response> => {
      requests.push({ init, url: String(input) })
      return Response.json({
        object: { sha: revision, type: "commit" },
        ref: "refs/heads/main",
      })
    }

    await expect(
      assertReleaseIsCurrentMain(validInput, fetchImplementation)
    ).resolves.toBeUndefined()
    expect(requests).toHaveLength(1)
    expect(requests[0]?.url).toBe(
      "https://api.github.com/repos/acme/writing-app/git/ref/heads/main"
    )
    expect(requests[0]?.init?.headers).toEqual({
      Accept: "application/vnd.github+json",
      Authorization: "Bearer github-actions-token",
      "X-GitHub-Api-Version": "2022-11-28",
    })
  })

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

  test("API 실패나 malformed reference 응답을 승인으로 바꾸지 않는다", async () => {
    await expect(
      assertReleaseIsCurrentMain(validInput, () =>
        Promise.resolve(new Response("unavailable", { status: 503 }))
      )
    ).rejects.toThrow("HTTP 503")
    await expect(
      assertReleaseIsCurrentMain(validInput, () =>
        Promise.resolve(
          Response.json({
            object: { sha: revision, type: "tag" },
            ref: "refs/heads/main",
          })
        )
      )
    ).rejects.toThrow("commit SHA")
  })

  test("credential URL, 잘못된 repository와 SHA를 요청 전에 거부한다", async () => {
    const unexpectedFetch = (): Promise<Response> => {
      throw new Error("fetch가 호출되면 안 됩니다.")
    }

    await expect(
      assertReleaseIsCurrentMain(
        { ...validInput, apiUrl: "https://token@example.com" },
        unexpectedFetch
      )
    ).rejects.toThrow("credential 없는 HTTPS")
    await expect(
      assertReleaseIsCurrentMain(
        { ...validInput, repository: "acme/writing/app" },
        unexpectedFetch
      )
    ).rejects.toThrow("owner/repository")
    await expect(
      assertReleaseIsCurrentMain(
        { ...validInput, releaseRevision: "main" },
        unexpectedFetch
      )
    ).rejects.toThrow("40자리 lowercase")
  })

  test("GitHub Enterprise API base path를 보존한다", async () => {
    let requestedUrl = ""
    await assertReleaseIsCurrentMain(
      { ...validInput, apiUrl: "https://github.example.com/api/v3/" },
      (input) => {
        requestedUrl = String(input)
        return Promise.resolve(
          Response.json({
            object: { sha: revision, type: "commit" },
            ref: "refs/heads/main",
          })
        )
      }
    )

    expect(requestedUrl).toBe(
      "https://github.example.com/api/v3/repos/acme/writing-app/git/ref/heads/main"
    )
  })
})
