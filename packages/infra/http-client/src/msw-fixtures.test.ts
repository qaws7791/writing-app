import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { setupServer } from "msw/node"

import {
  getGetAdminLivenessMockHandler,
  getGetAdminSessionMockHandler401,
} from "@workspace/http-client/admin/msw"
import {
  getCreateLearnerStepAiFeedbackMockHandler401,
  getCreateLearnerStepAiFeedbackMockHandler409,
  getCreateLearnerStepAiFeedbackMockHandler429,
  getCreateLearnerStepAiFeedbackMockHandler500,
  getGetProfileMockHandler,
} from "@workspace/http-client/learner/msw"
import {
  createApiErrorFixture,
  throwMswNetworkErrorFixture,
  type ApiErrorFixtureStatus,
} from "#http-client/msw-fixtures"

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("generated MSW public surface", () => {
  it("admin handler가 실제 DTO override와 admin base path를 사용한다", async () => {
    server.use(getGetAdminLivenessMockHandler({ ok: true, service: "api" }))

    const response = await fetch(
      "https://api.example.test/api/admin/health/live"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "api",
    })
  })

  it("admin canonical 401 fixture를 generated error DTO로 연결한다", async () => {
    const fixture = createApiErrorFixture(401)
    server.use(getGetAdminSessionMockHandler401(fixture))

    const response = await fetch("https://api.example.test/api/admin/session")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(fixture)
  })

  it.each([
    [401, getCreateLearnerStepAiFeedbackMockHandler401],
    [409, getCreateLearnerStepAiFeedbackMockHandler409],
    [429, getCreateLearnerStepAiFeedbackMockHandler429],
    [500, getCreateLearnerStepAiFeedbackMockHandler500],
  ] as const)(
    "learner canonical %i fixture를 generated status handler로 연결한다",
    async (status, createHandler) => {
      const fixture = createApiErrorFixture(status)
      server.use(createHandler(fixture))

      const response = await fetch(
        "https://api.example.test/api/learning/lessons/lesson-1/steps/step-1/ai-feedback",
        { method: "POST" }
      )

      expect(response.status).toBe(status)
      await expect(response.json()).resolves.toEqual(fixture)
    }
  )

  it("generated handler override로 network failure를 재현한다", async () => {
    server.use(getGetProfileMockHandler(() => throwMswNetworkErrorFixture()))

    await expect(
      fetch("https://api.example.test/api/profile")
    ).rejects.toThrow()
  })

  it("canonical fixture status 외의 HTTP 상태를 타입에 허용하지 않는다", () => {
    const statuses = [401, 409, 429, 500] satisfies ApiErrorFixtureStatus[]
    expect(statuses).toEqual([401, 409, 429, 500])
  })
})
