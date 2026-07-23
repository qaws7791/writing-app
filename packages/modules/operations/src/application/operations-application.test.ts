import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"
import type { AdminId, ConversationId } from "@workspace/types/ids"

import { createAiStreamingApplication } from "#operations/application/ai-conversations"
import { createAiRequestGuard } from "#operations/application/ai-request-guard"

const adminId = "admin-1" as AdminId
const conversationId = "conversation-1" as ConversationId
const now = new Date("2026-07-23T00:00:00.000Z")

describe("operations application", () => {
  it("provider가 없으면 conversation user message를 저장하지 않는다", async () => {
    const createUserMessage = vi.fn()
    const providerFailureObserver = vi.fn()
    const streaming = createAiStreamingApplication({
      clock: { now: () => now },
      provider: null,
      providerFailureObserver,
      repository: {
        createUserMessage,
        readConversation: vi.fn(),
        readConversations: vi.fn(),
        saveAssistantMessage: vi.fn(),
      },
    })

    const result = await streaming.startMessage({
      adminId,
      conversationId: null,
      message: "초안을 작성해 줘",
      signal: new AbortController().signal,
    })
    expect(result.isErr() && result.error).toEqual({
      kind: "provider-unavailable",
    })
    expect(createUserMessage).not.toHaveBeenCalled()
    expect(providerFailureObserver).toHaveBeenCalledWith({
      kind: "operations-ai-provider-failed",
      operation: "stream-text",
      reason: "provider-unavailable",
    })
    expect(JSON.stringify(providerFailureObserver.mock.calls)).not.toContain(
      "초안을 작성해 줘"
    )
  })

  it("같은 conversation의 in-flight 요청과 영속 quota 거절을 구분한다", async () => {
    const consume = vi
      .fn()
      .mockResolvedValueOnce(ok({ kind: "accepted" }))
      .mockResolvedValueOnce(
        ok({
          kind: "rejected",
          reason: "admin-minute",
          retryAfterSeconds: 30,
        })
      )
    const guard = createAiRequestGuard({ repository: { consume } })
    const input = {
      adminId,
      clientIp: "127.0.0.1",
      conversationId,
      now,
    }
    const firstResult = await guard.acquire(input)
    expect((await guard.acquire(input))._unsafeUnwrap()).toEqual({
      kind: "rejected",
      reason: "in-flight",
      retryAfterSeconds: 1,
    })
    if (firstResult.isErr()) throw new Error(firstResult.error.kind)
    if (firstResult.value.kind === "accepted") firstResult.value.release()
    expect((await guard.acquire(input))._unsafeUnwrap()).toEqual({
      kind: "rejected",
      reason: "admin-minute",
      retryAfterSeconds: 30,
    })
  })

  it("quota I/O가 진행 중이어도 같은 conversation의 동시 요청을 거절한다", async () => {
    let resolveQuota!: () => void
    const quotaStarted = new Promise<void>((resolve) => {
      resolveQuota = resolve
    })
    let releaseQuota!: () => void
    const quotaPending = new Promise<void>((resolve) => {
      releaseQuota = resolve
    })
    const consume = vi.fn(async () => {
      resolveQuota()
      await quotaPending
      return ok({ kind: "accepted" as const })
    })
    const guard = createAiRequestGuard({ repository: { consume } })
    const input = {
      adminId,
      clientIp: "127.0.0.1",
      conversationId,
      now,
    }

    const firstPending = guard.acquire(input)
    await quotaStarted
    await expect(
      guard.acquire(input).then((result) => result._unsafeUnwrap())
    ).resolves.toEqual({
      kind: "rejected",
      reason: "in-flight",
      retryAfterSeconds: 1,
    })
    expect(consume).toHaveBeenCalledTimes(1)
    releaseQuota()
    const first = await firstPending
    if (first.isErr()) throw new Error(first.error.kind)
    if (first.value.kind === "accepted") first.value.release()
  })

  it("quota persistence 실패를 typed application error로 반환하고 in-flight를 해제한다", async () => {
    const consume = vi.fn(async () =>
      err({
        kind: "operations-quota-persistence-failed" as const,
        operation: "consume-ai-quota" as const,
      })
    )
    const guard = createAiRequestGuard({ repository: { consume } })
    const input = {
      adminId,
      clientIp: "127.0.0.1",
      conversationId,
      now,
    }

    await expect(guard.acquire(input)).resolves.toEqual(
      err({ kind: "persistence-failed", operation: "consume-ai-quota" })
    )
    await guard.acquire(input)
    expect(consume).toHaveBeenCalledTimes(2)
  })
})
