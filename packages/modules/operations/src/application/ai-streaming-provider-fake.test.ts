import { describe, expect, it, vi } from "vitest"
import type { AdminId, ConversationId, MessageId } from "@workspace/types/ids"

import { createAiStreamingApplication } from "#operations/application/ai-conversations"

describe("operations AI provider fake integration", () => {
  it("provider stream을 그대로 전달하고 완료 메시지를 별도 저장한다", async () => {
    const adminId = "admin-1" as AdminId
    const conversationId = "conversation-1" as ConversationId
    const now = new Date("2026-07-23T00:00:00.000Z")
    const saveAssistantMessage = vi.fn(async (input) => ({
      ...input,
      id: "message-2" as MessageId,
      role: "assistant" as const,
    }))
    const application = createAiStreamingApplication({
      clock: { now: () => now },
      provider: {
        async streamText() {
          return (async function* () {
            yield "첫째"
            yield "둘째"
          })()
        },
      },
      repository: {
        async createUserMessage() {
          return {
            conversation: {
              conversation: {
                adminId,
                createdAt: now,
                id: conversationId,
                title: "요청",
                updatedAt: now,
              },
              messageCount: 1,
            },
            messages: [
              {
                content: "요청",
                conversationId,
                createdAt: now,
                id: "message-1" as MessageId,
                role: "user",
              },
            ],
          }
        },
        readConversation: vi.fn(),
        readConversations: vi.fn(),
        saveAssistantMessage,
      },
    })

    const started = await application.startMessage({
      adminId,
      conversationId: null,
      message: "요청",
      signal: new AbortController().signal,
    })
    if (started.isErr()) throw new Error(started.error.kind)
    const chunks: string[] = []
    for await (const chunk of started.value.stream) chunks.push(chunk)
    expect(chunks).toEqual(["첫째", "둘째"])

    const saved = await application.finishAssistantMessage({
      content: chunks.join(""),
      conversationId,
    })
    expect(saved.isOk()).toBe(true)
    expect(saveAssistantMessage).toHaveBeenCalledWith({
      content: "첫째둘째",
      conversationId,
      now,
    })
  })
})
