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
      providerFailureObserver: () => undefined,
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

  it("stream 소비 중 provider 실패를 원문 없이 분류한다", async () => {
    const adminId = "admin-1" as AdminId
    const conversationId = "conversation-1" as ConversationId
    const now = new Date("2026-07-23T00:00:00.000Z")
    const providerFailureObserver = vi.fn()
    const application = createAiStreamingApplication({
      clock: { now: () => now },
      provider: {
        async streamText() {
          return (async function* () {
            yield "첫째"
            throw new Error("provider-secret-response")
          })()
        },
      },
      providerFailureObserver,
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
        saveAssistantMessage: vi.fn(),
      },
    })

    const started = await application.startMessage({
      adminId,
      conversationId: null,
      message: "요청",
      signal: new AbortController().signal,
    })
    if (started.isErr()) throw new Error(started.error.kind)

    await expect(async () => {
      for await (const _chunk of started.value.stream) {
        continue
      }
    }).rejects.toThrow("provider-secret-response")
    expect(providerFailureObserver).toHaveBeenCalledOnce()
    expect(providerFailureObserver).toHaveBeenCalledWith({
      kind: "operations-ai-provider-failed",
      operation: "stream-text",
      reason: "provider-failed",
    })
    expect(JSON.stringify(providerFailureObserver.mock.calls)).not.toContain(
      "provider-secret-response"
    )
  })

  it.each([
    ["client-disconnect", null],
    ["output-limit", null],
    ["provider-timeout", "provider-timeout"],
  ] as const)(
    "%s abort를 provider outage와 구분한다",
    async (abortReason, observedReason) => {
      const adminId = "admin-1" as AdminId
      const conversationId = "conversation-1" as ConversationId
      const now = new Date("2026-07-23T00:00:00.000Z")
      const providerFailureObserver = vi.fn()
      const abortController = new AbortController()
      const application = createAiStreamingApplication({
        clock: { now: () => now },
        provider: {
          async streamText(_prompt, options) {
            return (async function* () {
              options.signal.throwIfAborted()
              yield "완료되지 않음"
            })()
          },
        },
        providerFailureObserver,
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
              messages: [],
            }
          },
          readConversation: vi.fn(),
          readConversations: vi.fn(),
          saveAssistantMessage: vi.fn(),
        },
      })
      const started = await application.startMessage({
        adminId,
        conversationId: null,
        message: "요청",
        signal: abortController.signal,
      })
      if (started.isErr()) throw new Error(started.error.kind)
      abortController.abort(abortReason)

      let rejection: unknown
      try {
        for await (const _chunk of started.value.stream) {
          continue
        }
      } catch (error) {
        rejection = error
      }

      expect(rejection).toBe(abortReason)
      if (observedReason === null) {
        expect(providerFailureObserver).not.toHaveBeenCalled()
      } else {
        expect(providerFailureObserver).toHaveBeenCalledWith({
          kind: "operations-ai-provider-failed",
          operation: "stream-text",
          reason: observedReason,
        })
      }
    }
  )
})
