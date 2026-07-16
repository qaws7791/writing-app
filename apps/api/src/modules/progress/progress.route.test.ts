import { describe, expect, it, vi } from "vitest"
import { learnerProgressPageSchema } from "@workspace/contracts/learning"

import { createApp } from "@/app"
import { createTestDependencies } from "@/routes/test-dependencies"

const authenticatedHeaders = {
  Cookie: "learner_session_token=active-token",
}

const version = {
  curriculumVersionId: "c1-v1",
  revision: 1,
} as const

const progressPage = learnerProgressPageSchema.parse({
  items: [
    {
      id: "c1",
      learning: {
        completedLessons: 1,
        lastActivityAt: "2026-06-14T00:00:00.000Z",
        nextLesson: {
          currentStepId: "l-new-s3",
          currentStepIndex: 2,
          estimatedMinutes: 10,
          id: "l-new",
          title: "새 학습 활동 둘러보기",
        },
        progressPercent: 33,
        status: "in_progress",
        totalLessons: 3,
        version,
      },
      title: "글쓰기 첫걸음 30일",
      visualKey: "basic-sentence-writing",
    },
  ],
  nextCursor: "next-page",
})

describe("플랫폼 API progress route", () => {
  it("코스별 학습 상태를 cursor page 형식으로 반환한다", async () => {
    const dependencies = createTestDependencies()
    const app = createApp({
      ...dependencies,
      progressService: {
        async readProgress() {
          return { kind: "ok", value: progressPage }
        },
      },
    })

    const response = await app.request("/progress", {
      headers: authenticatedHeaders,
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(progressPage)
  })

  it("status와 cursor query를 현재 학습자 범위로 전달한다", async () => {
    const dependencies = createTestDependencies()
    const readProgress = vi.fn(async () => ({
      kind: "ok" as const,
      value: progressPage,
    }))
    const app = createApp({
      ...dependencies,
      progressService: { readProgress },
    })

    const response = await app.request(
      "/progress?status=in_progress&cursor=next-page&limit=10",
      { headers: authenticatedHeaders }
    )

    expect(response.status).toBe(200)
    expect(readProgress).toHaveBeenCalledWith("user-1", {
      cursor: "next-page",
      limit: 10,
      status: "in_progress",
    })
  })

  it("유효하지 않은 cursor는 400 INVALID_CURSOR로 반환한다", async () => {
    const dependencies = createTestDependencies()
    const app = createApp({
      ...dependencies,
      progressService: {
        async readProgress() {
          return {
            error: { kind: "invalid-cursor" as const },
            kind: "err" as const,
          }
        },
      },
    })

    const response = await app.request("/progress?cursor=invalid", {
      headers: authenticatedHeaders,
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_CURSOR",
    })
  })
})
