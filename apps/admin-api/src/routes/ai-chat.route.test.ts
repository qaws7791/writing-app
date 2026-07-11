import { describe, expect, it, vi } from "vitest"

import { createApp, type AdminApiDependencies } from "@/app"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminAiChatConversationDetailDto,
  AdminAiChatConversationListDto,
  AdminAiChatMessageDto,
} from "@workspace/contracts/admin"
import type { AdminAiChatAgent } from "@/mastra/admin-content-agent"

const conversationDetail: AdminAiChatConversationDetailDto = {
  conversation: {
    createdAt: "2026-06-14T03:00:00.000Z",
    id: "chat-1",
    messageCount: 1,
    title: "소개 문구",
    updatedAt: "2026-06-14T03:00:00.000Z",
  },
  messages: [
    {
      content: "소개 문구를 써줘",
      createdAt: "2026-06-14T03:00:00.000Z",
      id: "message-1",
      role: "user",
    },
  ],
}

const completedConversationDetail: AdminAiChatConversationDetailDto = {
  conversation: {
    ...conversationDetail.conversation,
    messageCount: 2,
    updatedAt: "2026-06-14T03:00:00.000Z",
  },
  messages: conversationDetail.messages,
}

const assistantMessage: AdminAiChatMessageDto = {
  content: "바로 사용할 수 있는 소개 문구입니다.",
  createdAt: "2026-06-14T03:00:00.000Z",
  id: "message-2",
  role: "assistant",
}

const conversationList: AdminAiChatConversationListDto = {
  items: [completedConversationDetail.conversation],
}

describe("어드민 API ai chat route", () => {
  it("관리자 세션이 없으면 AI 채팅 목록 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/ai-chat/conversations")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  })

  it("대화 목록과 상세를 반환한다", async () => {
    const app = createApp(createDependencies())
    const headers = {
      Authorization: "Bearer admin-token",
    }

    const listResponse = await app.request("/ai-chat/conversations", {
      headers,
    })

    expect(listResponse.status).toBe(200)
    await expect(listResponse.json()).resolves.toEqual(conversationList)

    const detailResponse = await app.request("/ai-chat/conversations/chat-1", {
      headers,
    })

    expect(detailResponse.status).toBe(200)
    await expect(detailResponse.json()).resolves.toEqual(
      completedConversationDetail
    )
  })

  it("Mastra 에이전트 응답을 chunk와 done SSE 이벤트로 반환한다", async () => {
    const streamText = vi.fn(async () => {
      async function* stream() {
        yield "바로 사용할 수 있는 "
        yield "소개 문구입니다."
      }

      return stream()
    })
    const app = createApp(
      createDependencies({
        aiChatAgent: { streamText },
      })
    )

    const response = await app.request("/ai-chat/messages/stream", {
      body: JSON.stringify({
        message: "소개 문구를 써줘",
      }),
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toContain("event: done")
    expect(streamText).toHaveBeenCalledWith(
      expect.stringContaining("소개 문구를 써줘"),
      expect.objectContaining({ maxOutputTokens: 2_000 })
    )
  })

  it("AI provider가 없으면 저장 없이 error SSE 이벤트를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/ai-chat/messages/stream", {
      body: JSON.stringify({
        message: "소개 문구를 써줘",
      }),
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toContain("AI_PROVIDER_UNAVAILABLE")
  })

  it("요청 한도 초과 시 429와 Retry-After를 반환한다", async () => {
    const app = createApp({
      ...createDependencies(),
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

    const response = await app.request("/ai-chat/messages/stream", {
      body: JSON.stringify({ message: "소개 문구를 써줘" }),
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("30")
  })

  it("SSE 소비자가 취소하면 provider를 중단하고 assistant를 저장하지 않는다", async () => {
    let providerSignal: AbortSignal | undefined
    const streamText = vi.fn(
      async (
        _prompt: string,
        options: {
          readonly maxOutputTokens: number
          readonly signal: AbortSignal
        }
      ) => {
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
      }
    )
    const dependencies = createDependencies({
      aiChatAgent: { streamText },
    })
    const saveAssistant = vi.spyOn(
      dependencies.adminServices.aiChat,
      "saveAiChatAssistantMessage"
    )
    const app = createApp(dependencies)
    const response = await app.request("/ai-chat/messages/stream", {
      body: JSON.stringify({ message: "소개 문구를 써줘" }),
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    await vi.waitFor(() => expect(providerSignal).toBeDefined())
    await response.body?.cancel()
    await vi.waitFor(() => expect(providerSignal?.aborted).toBe(true))
    expect(saveAssistant).not.toHaveBeenCalled()
  })
})

function createDependencies({
  aiChatAgent,
}: {
  readonly aiChatAgent?: AdminAiChatAgent
} = {}): AdminApiDependencies {
  const dependencies = createTestAdminApiDependencies({
    adminServices: {
      aiChat: {
        async createAiChatUserMessage(input) {
          expect(input).toEqual({
            adminId: "admin-1",
            conversationId: null,
            message: "소개 문구를 써줘",
            now: testAdminNow,
          })
          return conversationDetail
        },
        async getAiChatConversation(input) {
          expect(input).toEqual({
            adminId: "admin-1",
            conversationId: "chat-1",
            messagePage: 1,
            messagePageSize: 100,
          })
          return completedConversationDetail
        },
        async getAiChatConversations(input) {
          expect(input).toEqual({
            adminId: "admin-1",
            page: 1,
            pageSize: 50,
          })
          return conversationList
        },
        async saveAiChatAssistantMessage(input) {
          expect(input).toEqual({
            content: assistantMessage.content,
            conversationId: "chat-1",
            now: testAdminNow,
          })
          return assistantMessage
        },
      },
    },
  })

  return aiChatAgent === undefined
    ? dependencies
    : {
        ...dependencies,
        aiChatAgent,
      }
}
