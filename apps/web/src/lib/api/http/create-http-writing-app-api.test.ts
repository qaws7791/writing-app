import { describe, expect, it } from "vitest"

import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import { readBrowserApiBaseUrl } from "@/runtime-config"

describe("HTTP WritingAppApi", () => {
  it("profile과 progress를 Better Auth 쿠키와 함께 조회한다", async () => {
    const requests: Request[] = []
    const api = createHttpWritingAppApi({
      baseUrl: readBrowserApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
      }),
      fetch: async (request) => {
        requests.push(request)

        if (request.url === "https://api.example.test/profile") {
          return jsonResponse({
            stats: {
              completedLessons: 1,
              currentStreakDays: 2,
              lastActiveDate: "2026-06-14",
              progressPercent: 10,
              totalLessons: 10,
            },
            user: {
              email: "learner@example.com",
              id: "user-1",
              image: null,
              joinedAt: "2026-06-01T00:00:00.000Z",
              name: "학습자",
              status: "active",
            },
          })
        }

        if (request.url === "https://api.example.test/progress") {
          return jsonResponse({
            courses: [],
            user: {
              currentStreakDays: 2,
            },
          })
        }

        if (
          request.url === "https://api.example.test/progress?status=in_progress"
        ) {
          return jsonResponse({
            courses: [],
            user: {
              currentStreakDays: 2,
            },
          })
        }

        throw new Error(`unexpected request: ${request.url}`)
      },
      tokenProvider: () => "token-1",
    })

    await expect(api.getProfile()).resolves.toMatchObject({
      status: "ok",
      value: {
        user: {
          id: "user-1",
        },
      },
    })
    await expect(api.getProgress()).resolves.toMatchObject({
      status: "ok",
      value: {
        currentStreakDays: 2,
      },
    })
    await expect(
      api.getProgress({ status: "in_progress" })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        currentStreakDays: 2,
      },
    })
    expect(requests.map((request) => request.url)).toEqual([
      "https://api.example.test/profile",
      "https://api.example.test/progress",
      "https://api.example.test/progress?status=in_progress",
    ])
    expect(requests[0]?.headers.get("Cookie")).toBe(
      "learner_session_token=token-1"
    )
    expect(requests[0]?.credentials).toBe("include")
  })

  it("답변 저장, 레슨 완료, AI 코칭 생성을 POST 요청으로 전달한다", async () => {
    const bodies: unknown[] = []
    const urls: string[] = []
    const api = createHttpWritingAppApi({
      baseUrl: readBrowserApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test/",
      }),
      fetch: async (request) => {
        urls.push(request.url)
        bodies.push(await request.json())

        if (request.url === "https://api.example.test/ai-feedback") {
          return jsonResponse({
            improvements: ["근거를 보강하세요."],
            nextAction: "예시를 추가하세요.",
            remainingAttempts: 2,
            score: 82,
            scoreRange: [0, 100],
            showScore: true,
            strengths: ["핵심이 분명합니다."],
            summary: "좋은 출발입니다.",
          })
        }

        return jsonResponse({
          saved: true,
        })
      },
      tokenProvider: () => "token-1",
    })

    await expect(
      api.saveLessonAnswer({
        answer: {
          text: "나의 답변",
          type: "WRITE",
        },
        lessonId: "l1",
        stepId: "s1",
      })
    ).resolves.toEqual({
      status: "ok",
      value: {
        saved: true,
      },
    })
    await expect(
      api.completeLesson({
        currentStepIndex: 2,
        lessonId: "l1",
      })
    ).resolves.toEqual({
      status: "ok",
      value: {
        saved: true,
      },
    })
    await expect(
      api.createAiFeedback({
        answer: "나의 답변",
        lessonId: "l1",
        stepId: "s2",
      })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        remainingAttempts: 2,
        summary: "좋은 출발입니다.",
      },
    })
    expect(bodies).toEqual([
      {
        answer: {
          text: "나의 답변",
          type: "WRITE",
        },
        lessonId: "l1",
        stepId: "s1",
      },
      {
        currentStepIndex: 2,
      },
      {
        answer: "나의 답변",
        lessonId: "l1",
        stepId: "s2",
      },
    ])
    expect(urls).toEqual([
      "https://api.example.test/learning/answers",
      "https://api.example.test/learning/lessons/l1/complete",
      "https://api.example.test/ai-feedback",
    ])
  })

  it("실패 응답을 ApiFailure로 변환한다", async () => {
    const api = createHttpWritingAppApi({
      baseUrl: readBrowserApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
      }),
      fetch: async () =>
        jsonResponse(
          {
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          },
          401
        ),
      tokenProvider: () => null,
    })

    await expect(api.getProfile()).resolves.toEqual({
      error: {
        code: "unauthorized",
        message: "로그인이 필요합니다.",
        status: 401,
      },
      status: "error",
    })
  })

  it("성공 응답이 계약과 다르면 contract-error를 반환한다", async () => {
    const api = createHttpWritingAppApi({
      baseUrl: readBrowserApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
      }),
      fetch: async () =>
        jsonResponse({
          stats: {
            completedLessons: 1,
          },
          user: {
            id: "user-1",
          },
        }),
      tokenProvider: () => "token-1",
    })

    await expect(api.getProfile()).resolves.toEqual({
      error: {
        code: "contract-error",
        message: "API 응답을 해석할 수 없습니다.",
        status: 200,
      },
      status: "error",
    })
  })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  })
}
