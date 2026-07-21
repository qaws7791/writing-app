import { describe, expect, it, vi } from "vitest"

import {
  adminAiChatConversationDetailDtoSchema,
  type AdminAiChatConversationDetailDto,
  type AdminAiChatMessageDto,
} from "@workspace/contracts/admin"
import { conversationIdSchema } from "@workspace/contracts/admin/ai-chat-data"
import { adminIdSchema } from "@workspace/contracts/admin/identity-data"
import { adminRoles, type AiChatRepository } from "@workspace/core/admin"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/auth/admin/server"
import { createAdminApp } from "@/http/admin-app"
import type { AdminAiChatAgent } from "@/modules/admin-ai-chat/admin-ai-chat-agent"
import {
  createAiChatRequestGuard,
  type AiChatRequestGuard,
} from "@/modules/admin-ai-chat/ai-chat-request-guard"
import {
  createAdminAiChatRoutes,
  type AdminAiChatRouteDependencies,
} from "@/modules/admin-ai-chat/admin-ai-chat.routes"

const testNow = new Date("2026-06-14T03:00:00.000Z")
const conversationDetail = adminAiChatConversationDetailDtoSchema.parse({
  conversation: {
    createdAt: testNow.toISOString(),
    id: conversationIdSchema.parse("chat-1"),
    messageCount: 1,
    title: "소개 문구",
    updatedAt: testNow.toISOString(),
  },
  messages: [
    {
      content: "소개 문구를 써줘",
      createdAt: testNow.toISOString(),
      id: "message-1",
      role: "user",
    },
  ],
})
const completedConversationDetail =
  adminAiChatConversationDetailDtoSchema.parse({
    ...conversationDetail,
    conversation: {
      ...conversationDetail.conversation,
      messageCount: 2,
    },
    messages: [...conversationDetail.messages],
  })
const assistantMessage: AdminAiChatMessageDto = {
  content: "바로 사용할 수 있는 소개 문구입니다.",
  createdAt: testNow.toISOString(),
  id: "message-2",
  role: "assistant",
}

describe("통합 runtime 관리자 AI chat route", () => {
  it("목록·상세와 세션 검증을 공개 wire 계약으로 제공한다", async () => {
    const app = createApp(createDependencies())
    const headers = { Cookie: "admin_session_token=admin-token" }

    const unauthorized = await app.request("/ai-chat/conversations")
    const list = await app.request("/ai-chat/conversations", { headers })
    const detail = await app.request("/ai-chat/conversations/chat-1", {
      headers,
    })

    expect(unauthorized.status).toBe(401)
    await expect(unauthorized.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
    expect(list.status).toBe(200)
    await expect(list.json()).resolves.toEqual({
      items: [completedConversationDetail.conversation],
    })
    expect(detail.status).toBe(200)
    await expect(detail.json()).resolves.toEqual(completedConversationDetail)
  })

  it("잘못된 query·application 결과와 없는 대화를 기존 status로 격리한다", async () => {
    const dependencies = createDependencies()
    const app = createApp(dependencies)
    const headers = { Cookie: "admin_session_token=admin-token" }
    const invalidPagination = await app.request(
      "/ai-chat/conversations?page=0&pageSize=51",
      { headers }
    )
    const missing = await createApp(
      createDependencies({ missingReadConversation: true })
    ).request("/ai-chat/conversations/chat-1", { headers })
    const invalidResult = await createApp(
      createDependencies({ invalidConversationResult: true })
    ).request("/ai-chat/conversations", { headers })

    expect(invalidPagination.status).toBe(400)
    await expect(invalidPagination.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
    })
    expect(
      dependencies.aiChatRepository.readAiChatConversations
    ).not.toHaveBeenCalled()
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toEqual({
      code: "NOT_FOUND",
      message: "Not Found",
    })
    expect(invalidResult.status).toBe(500)
    await expect(invalidResult.json()).resolves.toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    })
  })

  it("chunk 뒤 done SSE event와 cache header를 유지한다", async () => {
    const streamText = vi.fn(async () =>
      textStream(["바로 사용할 수 있는 ", "소개 문구입니다."])
    )
    const app = createApp(createDependencies({ aiChatAgent: { streamText } }))

    const response = await postStream(app)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toContain("text/event-stream")
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("Vary")).toContain("Cookie")
    await expect(response.text().then(parseSseFrames)).resolves.toEqual([
      { data: { delta: "바로 사용할 수 있는 " }, event: "chunk" },
      { data: { delta: "소개 문구입니다." }, event: "chunk" },
      {
        data: {
          conversation: completedConversationDetail.conversation,
          message: assistantMessage,
        },
        event: "done",
      },
    ])
    expect(streamText).toHaveBeenCalledWith(
      expect.stringContaining("소개 문구를 써줘"),
      expect.objectContaining({ maxOutputTokens: 2_000 })
    )
  })

  it("provider 부재·실패와 찾을 수 없는 대화를 schema 검증된 error SSE로 격리한다", async () => {
    const cases = [
      [
        createDependencies(),
        "AI_PROVIDER_UNAVAILABLE",
        "AI provider is unavailable",
      ],
      [
        createDependencies({
          aiChatAgent: {
            async streamText() {
              throw new Error("provider failure")
            },
          },
        }),
        "AI_STREAM_FAILED",
        "AI stream failed",
      ],
      [
        createDependencies({
          aiChatAgent: { streamText: async () => textStream([]) },
          missingCreatedConversation: true,
        }),
        "NOT_FOUND",
        "Conversation was not found",
      ],
    ] as const

    for (const [dependencies, code, message] of cases) {
      const response = await postStream(createApp(dependencies))

      await expect(response.text().then(parseSseFrames)).resolves.toEqual([
        { data: { code, message }, event: "error" },
      ])
    }
  })

  it("요청 한도 초과는 Retry-After와 429를 반환하고 application 호출 전 거절한다", async () => {
    const dependencies = createDependencies({
      aiChatRequestGuard: {
        acquire() {
          return {
            kind: "rejected",
            reason: "rate-limit",
            retryAfterSeconds: 30,
          }
        },
      },
    })
    const response = await postStream(createApp(dependencies))

    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("30")
    await expect(response.json()).resolves.toEqual({
      code: "AI_CHAT_RATE_LIMITED",
      message: "AI 채팅 요청 한도를 초과했습니다.",
    })
    expect(
      dependencies.aiChatRepository.createAiChatUserMessage
    ).not.toHaveBeenCalled()
  })

  it("빈 stream message는 target route에서 400으로 거절한다", async () => {
    const dependencies = createDependencies()
    const response = await createApp(dependencies).request(
      "/ai-chat/messages/stream",
      {
        body: JSON.stringify({ message: "   " }),
        headers: {
          Cookie: "admin_session_token=admin-token",
          "Content-Type": "application/json",
          Origin: localRuntimeDefaults.adminWebOrigin,
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
    expect(
      dependencies.aiChatRepository.createAiChatUserMessage
    ).not.toHaveBeenCalled()
  })

  it("SSE 소비자 취소는 provider abort로 전달하고 assistant 저장을 건너뛴다", async () => {
    let providerSignal: AbortSignal | undefined
    const dependencies = createDependencies({
      aiChatAgent: {
        async streamText(_prompt, options) {
          providerSignal = options.signal

          async function* stream() {
            await new Promise<void>((resolve) => {
              options.signal.addEventListener("abort", () => resolve(), {
                once: true,
              })
            })
            yield ""
          }

          return stream()
        },
      },
    })
    const response = await postStream(createApp(dependencies))

    await vi.waitFor(() => expect(providerSignal).toBeDefined())
    await response.body?.cancel()
    await vi.waitFor(() => expect(providerSignal?.aborted).toBe(true))
    expect(
      dependencies.aiChatRepository.saveAiChatAssistantMessage
    ).not.toHaveBeenCalled()
  })

  it("30초 provider timeout은 provider를 중단하고 assistant를 저장하지 않는다", async () => {
    vi.useFakeTimers()
    try {
      let providerSignal: AbortSignal | undefined
      const dependencies = createDependencies({
        aiChatAgent: {
          async streamText(_prompt, options) {
            providerSignal = options.signal

            async function* stream() {
              await new Promise<void>((resolve) => {
                options.signal.addEventListener("abort", () => resolve(), {
                  once: true,
                })
              })
              yield* []
            }

            return stream()
          },
        },
      })
      const response = await postStream(createApp(dependencies))
      const bodyPromise = response.text()

      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(30_000)

      await expect(bodyPromise).resolves.toBe("")
      expect(providerSignal?.aborted).toBe(true)
      expect(
        dependencies.aiChatRepository.saveAiChatAssistantMessage
      ).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it("AI chat OpenAPI가 조회와 SSE target operation을 등록한다", async () => {
    const app = createApp(createDependencies())
    const response = await app.request("/openapi")
    const document = await response.json()

    expect(response.status).toBe(200)
    expect(document).toMatchObject({
      components: {
        securitySchemes: {
          adminSessionCookie: {
            in: "cookie",
            name: "admin_session_token",
            type: "apiKey",
          },
        },
      },
      paths: {
        "/api/admin/ai-chat/conversations": {
          get: { operationId: "getAdminAiChatConversations" },
        },
        "/api/admin/ai-chat/conversations/{conversationId}": {
          get: { operationId: "getAdminAiChatConversation" },
        },
        "/api/admin/ai-chat/messages/stream": {
          post: { operationId: "streamAdminAiChatMessage" },
        },
      },
    })
  })
})

function createApp(dependencies: AdminAiChatRouteDependencies) {
  return createAdminApp({
    capabilityRoutes: createAdminAiChatRoutes(dependencies),
    sessionResolver: dependencies.sessionResolver,
  })
}

function createDependencies({
  aiChatAgent,
  aiChatRequestGuard = createAiChatRequestGuard(),
  invalidConversationResult = false,
  missingCreatedConversation = false,
  missingReadConversation = false,
}: {
  readonly aiChatAgent?: AdminAiChatAgent
  readonly aiChatRequestGuard?: AiChatRequestGuard
  readonly invalidConversationResult?: boolean
  readonly missingCreatedConversation?: boolean
  readonly missingReadConversation?: boolean
} = {}): AdminAiChatRouteDependencies & {
  readonly aiChatRepository: {
    readonly createAiChatUserMessage: ReturnType<typeof vi.fn>
    readonly readAiChatConversation: ReturnType<typeof vi.fn>
    readonly readAiChatConversations: ReturnType<typeof vi.fn>
    readonly saveAiChatAssistantMessage: ReturnType<typeof vi.fn>
  }
} {
  const prepared = invalidConversationResult
    ? createInvalidConversation()
    : conversationDetail
  const completed = invalidConversationResult
    ? createInvalidConversation()
    : completedConversationDetail
  const aiChatRepository = {
    createAiChatUserMessage: vi.fn(async () =>
      missingCreatedConversation
        ? null
        : {
            conversation: prepared.conversation,
            messageItems: prepared.messages,
          }
    ),
    readAiChatConversation: vi.fn(async () =>
      missingReadConversation
        ? null
        : {
            conversation: completed.conversation,
            messageItems: completed.messages,
          }
    ),
    readAiChatConversations: vi.fn(async () => [completed.conversation]),
    saveAiChatAssistantMessage: vi.fn(async () => assistantMessage),
  } satisfies AiChatRepository
  const sessionResolver = createSessionResolver()

  return {
    aiChatAgent,
    aiChatRequestGuard,
    aiChatRepository,
    now: () => testNow,
    sessionResolver,
  }
}

function createInvalidConversation(): AdminAiChatConversationDetailDto {
  return {
    ...conversationDetail,
    conversation: {
      ...conversationDetail.conversation,
      messageCount: -1,
    },
  }
}

function createSessionResolver(): AdminSessionResolver {
  const session = {
    admin: {
      email: "admin@example.com",
      id: adminIdSchema.parse("admin-1"),
      name: "관리자",
      role: adminRoles.owner,
    },
    [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
  } as const satisfies AdminAuthenticatedSession

  return {
    async resolveSession(headers) {
      return headers.get("Cookie")?.includes("admin_session_token=admin-token")
        ? session
        : null
    },
  }
}

function postStream(app: ReturnType<typeof createAdminApp>) {
  return app.request("/ai-chat/messages/stream", {
    body: JSON.stringify({ message: "소개 문구를 써줘" }),
    headers: {
      Cookie: "admin_session_token=admin-token",
      "Content-Type": "application/json",
      Origin: localRuntimeDefaults.adminWebOrigin,
    },
    method: "POST",
  })
}

async function* textStream(values: readonly string[]): AsyncIterable<string> {
  yield* values
}

function parseSseFrames(value: string): readonly {
  readonly data: unknown
  readonly event: string
}[] {
  return value
    .trim()
    .split("\n\n")
    .filter((frame) => frame.length > 0)
    .map((frame) => {
      const [eventLine, dataLine] = frame.split("\n")
      if (
        eventLine === undefined ||
        dataLine === undefined ||
        !eventLine.startsWith("event: ") ||
        !dataLine.startsWith("data: ")
      ) {
        throw new Error("잘못된 SSE fixture frame입니다.")
      }
      const data: unknown = JSON.parse(dataLine.slice("data: ".length))

      return {
        data,
        event: eventLine.slice("event: ".length),
      }
    })
}
