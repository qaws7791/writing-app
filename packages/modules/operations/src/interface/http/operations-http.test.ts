import { describe, expect, it, vi } from "vitest"
import { createApp } from "@workspace/http-platform/core"
import { err, ok } from "@workspace/kernel/result"
import type {
  AdminId,
  AiChangeProposalId,
  ConversationId,
  CourseId,
  MessageId,
} from "@workspace/types/ids"

import { createAiStreamingApplication } from "#operations/application/ai-conversations"
import { createOperationsSettingsApplication } from "#operations/application/operations-settings"
import type { AiConversationRepository } from "#operations/application/ports/operations-ports"
import type { AiChangeProposal } from "#operations/domain/ai-change-proposal"
import type { OperationsActor } from "#operations/domain/operations-actor"
import { createOperationsRoutes } from "#operations/interface/http/operations-http"

const adminId = "admin-1" as AdminId
const conversationId = "conversation-1" as ConversationId
const now = new Date("2026-07-23T00:00:00.000Z")
const cookie = "admin_session_token=admin-token"
const approvedProposal: AiChangeProposal = {
  change: {
    courseId: "course-1" as CourseId,
    expectedEditVersion: 1,
    kind: "content-course-draft",
    title: "새 제목",
  },
  conversationId,
  createdAt: now,
  createdByAdminId: adminId,
  id: "proposal-1" as AiChangeProposalId,
  reviewedAt: now,
  reviewedByAdminId: adminId,
  status: "approved",
}

describe("operations HTTP contract", () => {
  it("인증 없는 요청을 거절하고 인증된 read에는 private no-store를 적용한다", async () => {
    const fixture = createFixture()
    const anonymous = await fixture.app.request("/dashboard")
    const authenticated = await fixture.app.request("/dashboard", {
      headers: { Cookie: cookie },
    })

    expect(anonymous.status).toBe(401)
    await expect(anonymous.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    })
    expect(authenticated.status).toBe(200)
    expect(authenticated.headers.get("Cache-Control")).toBe("private, no-store")
  })

  it("부분 reporting 실패를 불완전한 성공으로 숨기지 않고 503으로 공개한다", async () => {
    const fixture = createFixture({ reportingUnavailable: true })
    const response = await fixture.app.request("/dashboard", {
      headers: { Cookie: cookie },
    })

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      code: "OPERATIONS_REPORTING_UNAVAILABLE",
    })
  })

  it("operator의 owner mutation을 403으로 거절하고 security audit에 남긴다", async () => {
    const fixture = createFixture({ role: "operator" })
    const response = await fixture.app.request("/settings/notice", {
      body: JSON.stringify({ announce: "공지", banner: "배너" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      method: "PUT",
    })

    expect(response.status).toBe(403)
    expect(fixture.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "owner.mutation",
        outcome: "denied",
      })
    )
  })

  it("quota 거절은 안정된 code와 Retry-After를 반환하고 audit한다", async () => {
    const fixture = createFixture({ quotaRejected: true })
    const response = await postStream(fixture.app)

    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("30")
    await expect(response.json()).resolves.toEqual({
      code: "AI_CHAT_RATE_LIMITED",
      message: "AI 채팅 요청 한도를 초과했습니다.",
    })
    expect(fixture.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ai.quota.exceeded" })
    )
  })

  it("quota persistence 실패를 명시적 503으로 mapping한다", async () => {
    const fixture = createFixture({ quotaFailure: true })
    const response = await postStream(fixture.app)

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      code: "OPERATIONS_UNAVAILABLE",
    })
  })

  it("proxy가 정제해 덮어쓴 client IP만 quota 입력으로 사용한다", async () => {
    const fixture = createFixture()
    const response = await postStream(fixture.app, {
      "CF-Connecting-IP": "198.51.100.1",
      "X-Forwarded-For": "198.51.100.2",
      "X-Real-IP": "198.51.100.3",
      "X-Writing-App-Client-IP": "203.0.113.7",
    })
    await response.text()

    expect(fixture.acquire).toHaveBeenCalledWith(
      expect.objectContaining({ clientIp: "203.0.113.7" })
    )
  })

  it("정제되지 않은 client IP header는 quota 식별자로 신뢰하지 않는다", async () => {
    const fixture = createFixture()
    const response = await postStream(fixture.app, {
      "CF-Connecting-IP": "198.51.100.1",
      "X-Forwarded-For": "198.51.100.2",
      "X-Real-IP": "198.51.100.3",
    })
    await response.text()

    expect(fixture.acquire).toHaveBeenCalledWith(
      expect.objectContaining({ clientIp: "unknown" })
    )
  })

  it("AI 변경안 승인 결과를 canonical contract로 반환하고 audit한다", async () => {
    const fixture = createFixture({ proposalReviewSucceeded: true })
    const response = await fixture.app.request(
      "/ai-chat/proposals/proposal-1/approve",
      { headers: { Cookie: cookie }, method: "POST" }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "proposal-1",
      status: "approved",
    })
    expect(fixture.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ai.change.reviewed",
        outcome: "succeeded",
      })
    )
  })

  it("provider 부재는 user message 저장 없이 canonical error SSE만 전송한다", async () => {
    const createUserMessage = vi.fn()
    const fixture = createFixture({ createUserMessage, provider: null })
    const response = await postStream(fixture.app)

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    await expect(response.text().then(readSseEvents)).resolves.toEqual([
      {
        data: {
          code: "AI_PROVIDER_UNAVAILABLE",
          message: "AI provider is unavailable",
        },
        event: "error",
      },
    ])
    expect(createUserMessage).not.toHaveBeenCalled()
  })

  it("provider 실패는 기존 AI_STREAM_FAILED error SSE로 변환한다", async () => {
    const fixture = createFixture({
      provider: {
        async streamText() {
          throw new Error("provider failed")
        },
      },
    })
    const response = await postStream(fixture.app)

    await expect(response.text().then(readSseEvents)).resolves.toEqual([
      {
        data: { code: "AI_STREAM_FAILED", message: "AI stream failed" },
        event: "error",
      },
    ])
  })

  it("성공 streaming은 canonical chunk와 done event만 전송한다", async () => {
    const fixture = createFixture({
      provider: {
        async streamText() {
          return (async function* () {
            yield "완성된 "
            yield "문구"
          })()
        },
      },
    })
    const response = await postStream(fixture.app)
    const events = readSseEvents(await response.text())

    expect(events.map((event) => event.event)).toEqual([
      "chunk",
      "chunk",
      "done",
    ])
  })
})

function createFixture(
  input: {
    readonly createUserMessage?: ReturnType<
      typeof vi.fn<AiConversationRepository["createUserMessage"]>
    >
    readonly provider?: Parameters<
      typeof createAiStreamingApplication
    >[0]["provider"]
    readonly proposalReviewSucceeded?: boolean
    readonly quotaFailure?: boolean
    readonly quotaRejected?: boolean
    readonly reportingUnavailable?: boolean
    readonly role?: "operator" | "owner"
  } = {}
) {
  const audit = vi.fn()
  const actor: OperationsActor = {
    email: "admin@example.com",
    id: adminId,
    name: "관리자",
    settingsMutation: input.role === "operator" ? "forbidden" : "allowed",
  }
  const history = {
    conversation: {
      conversation: {
        adminId,
        createdAt: now,
        id: conversationId,
        title: "문구",
        updatedAt: now,
      },
      messageCount: 2,
    },
    messages: [
      {
        content: "문구를 작성해 줘",
        conversationId,
        createdAt: now,
        id: "message-1" as MessageId,
        role: "user" as const,
      },
    ],
  }
  const createUserMessage =
    input.createUserMessage ?? vi.fn(async () => history)
  const conversationRepository = {
    createUserMessage,
    readConversation: vi.fn(async () => history),
    readConversations: vi.fn(async () => [history.conversation]),
    saveAssistantMessage: vi.fn(async ({ content }: { content: string }) => ({
      content,
      conversationId,
      createdAt: now,
      id: "message-2" as MessageId,
      role: "assistant" as const,
    })),
  }
  const streaming = createAiStreamingApplication({
    clock: { now: () => now },
    provider:
      input.provider === undefined
        ? {
            async streamText() {
              return (async function* () {
                yield "문구"
              })()
            },
          }
        : input.provider,
    providerFailureObserver: () => undefined,
    repository: conversationRepository,
  })
  const acquire = vi.fn(async () => {
    if (input.quotaFailure === true) {
      return err({
        kind: "persistence-failed" as const,
        operation: "consume-ai-quota",
      })
    }
    return ok(
      input.quotaRejected
        ? {
            kind: "rejected" as const,
            reason: "admin-minute" as const,
            retryAfterSeconds: 30,
          }
        : { kind: "accepted" as const, release: () => undefined }
    )
  })
  const routes = createOperationsRoutes({
    ai: {
      conversations: {
        readConversation: async () => ok(history),
        readConversations: async () => ok([history.conversation]),
      },
      guard: { acquire },
      proposals: {
        createProposal: async () =>
          err({ kind: "validation-failed", reason: "not-used" }),
        readProposal: async () =>
          input.proposalReviewSucceeded
            ? ok(approvedProposal)
            : err({ kind: "not-found", target: "proposal" }),
        reviewProposal: async () =>
          input.proposalReviewSucceeded
            ? ok(approvedProposal)
            : err({ kind: "not-found", target: "proposal" }),
      },
      streaming,
    },
    audit,
    now: () => now,
    reporting: {
      readAnalytics: async () =>
        ok({ dailySeries: [], streakBuckets: [], worstLessons: [] }),
      readDashboard: async () =>
        input.reportingUnavailable
          ? err({ kind: "reporting-unavailable", sources: ["content"] })
          : ok({
              metrics: {
                activeCourses: 0,
                activeLessons: 0,
                activeUsersLast7Days: 0,
                completedLessons: 0,
                signupsLast7Days: 0,
                signupsToday: 0,
                totalUsers: 0,
              },
              recentActivities: [],
            }),
      readLessonAnalytics: async () =>
        ok({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }),
    },
    session: {
      async resolveActor(headers) {
        return headers.get("Cookie") === cookie ? actor : null
      },
    },
    settings: createOperationsSettingsApplication({
      readSettings: async () => ({
        legal: { privacy: "", terms: "" },
        notice: { announce: "", banner: "" },
      }),
      saveLegalDocument: async (document) => ({
        legal: document,
        notice: { announce: "", banner: "" },
      }),
      saveNoticeDocument: async (document) => ({
        legal: { privacy: "", terms: "" },
        notice: document,
      }),
    }),
  })
  const app = createApp({
    middleware: [
      async (context, next) => {
        context.set("requestId", "request-1")
        await next()
      },
    ],
    routes,
  })
  return { acquire, app, audit }
}

function postStream(
  app: ReturnType<typeof createFixture>["app"],
  headers: Readonly<Record<string, string>> = {}
) {
  return app.request("/ai-chat/messages/stream", {
    body: JSON.stringify({ message: "문구를 작성해 줘" }),
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...headers,
    },
    method: "POST",
  })
}

function readSseEvents(body: string) {
  return body
    .trim()
    .split("\n\n")
    .filter(Boolean)
    .map((frame) => {
      const lines = frame.split("\n")
      return {
        data: JSON.parse(lines[1]?.slice("data: ".length) ?? "null"),
        event: lines[0]?.slice("event: ".length),
      }
    })
}
