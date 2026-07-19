import { describe, expect, it } from "vitest"

import { createHttpWritingAppApi } from "@/shared/http/create-http-writing-app-api"
import type { FetchLike } from "@/shared/http/openapi-client"
import { readBrowserApiBaseUrl } from "@/shared/config/runtime-config"

describe("HTTP WritingAppApi", () => {
  it("start와 complete 명령을 lesson-scoped route로 보낸다", async () => {
    const { fetch, requests } = createFetch([
      jsonResponse({
        completedSteps: 0,
        currentStepId: "step-1",
        currentStepIndex: 0,
        progressPercent: 0,
        status: "in_progress",
        totalSteps: 2,
        version: { curriculumVersionId: "version-1", revision: 1 },
      }),
      jsonResponse({
        evaluation: null,
        learning: {
          completedSteps: 1,
          currentStepId: "step-2",
          currentStepIndex: 1,
          progressPercent: 50,
          status: "in_progress",
          totalSteps: 2,
          version: { curriculumVersionId: "version-1", revision: 1 },
        },
        status: "advanced",
      }),
    ])
    const api = createApi(fetch)

    await api.startLesson({
      expectedCurriculumVersionId: "version-1",
      lessonId: "lesson-1",
    })
    await api.completeStep({
      lessonId: "lesson-1",
      request: { kind: "acknowledge" },
      stepId: "step-1",
    })

    expect(await readRequest(requests, 0)).toMatchObject({
      body: JSON.stringify({ expectedCurriculumVersionId: "version-1" }),
      url: "https://api.example.test/learning/lessons/lesson-1/start",
    })
    expect(await readRequest(requests, 1)).toMatchObject({
      body: JSON.stringify({ kind: "acknowledge" }),
      url: "https://api.example.test/learning/lessons/lesson-1/steps/step-1/complete",
    })
  })

  it("AI feedback에 필수 idempotency header를 보내고 body는 보내지 않는다", async () => {
    const { fetch, requests } = createFetch([
      jsonResponse({
        feedback: {
          improvements: [],
          nextAction: "다음 행동",
          remainingAttempts: 1,
          score: 0,
          scoreRange: [0, 100],
          showScore: false,
          strengths: [],
          summary: "요약",
        },
        transition: {
          evaluation: null,
          learning: {
            completedSteps: 2,
            currentStepId: "step-3",
            currentStepIndex: 2,
            progressPercent: 67,
            status: "in_progress",
            totalSteps: 3,
            version: { curriculumVersionId: "version-1", revision: 1 },
          },
          status: "advanced",
        },
      }),
    ])
    const api = createApi(fetch)

    await api.requestAiFeedback({
      idempotencyKey: "feedback-key-1",
      lessonId: "lesson-1",
      stepId: "step-ai",
    })

    const request = requests[0]
    expect(request).toBeInstanceOf(Request)
    if (!(request instanceof Request)) return
    expect(request.url).toBe(
      "https://api.example.test/learning/lessons/lesson-1/steps/step-ai/ai-feedback"
    )
    expect(request.headers.get("Idempotency-Key")).toBe("feedback-key-1")
    expect(await request.clone().text()).toBe("")
  })
})

function createApi(fetch: FetchLike) {
  return createHttpWritingAppApi({
    baseUrl: readBrowserApiBaseUrl({
      NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
      NODE_ENV: "test",
    }),
    fetch,
    tokenProvider: () => "session-token",
  })
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  })
}

function createFetch(responses: readonly Response[]): {
  readonly fetch: FetchLike
  readonly requests: Request[]
} {
  const requests: Request[] = []
  let responseIndex = 0
  const fetch: FetchLike = async (request) => {
    requests.push(request)
    const response = responses[responseIndex]
    responseIndex += 1
    if (response === undefined) throw new Error("준비된 응답이 없습니다.")
    return response
  }
  return { fetch, requests }
}

async function readRequest(requests: readonly Request[], index: number) {
  const request = requests[index]
  if (!(request instanceof Request)) throw new Error("Request가 필요합니다.")
  return { body: await request.clone().text(), url: request.url }
}
