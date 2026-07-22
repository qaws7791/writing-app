import { describe, expect, it, vi } from "vitest"
import type {
  AdminId,
  AiChangeProposalId,
  ConversationId,
  CourseId,
} from "@workspace/types/ids"

import { createAiChangeProposalApplication } from "#operations/application/ai-change-proposals"
import { createAiStreamingApplication } from "#operations/application/ai-conversations"
import { createAiRequestGuard } from "#operations/application/ai-request-guard"
import { createOperationsSettingsApplication } from "#operations/application/operations-settings"
import type { AiChangeProposalRepository } from "#operations/application/ports/operations-ports"
import type { AiChangeProposal } from "#operations/domain/ai-change-proposal"

const adminId = "admin-1" as AdminId
const conversationId = "conversation-1" as ConversationId
const now = new Date("2026-07-23T00:00:00.000Z")
const actor = {
  email: "admin@example.com",
  id: adminId,
  name: "관리자",
  settingsMutation: "allowed" as const,
}

describe("operations application", () => {
  it("provider가 없으면 conversation user message를 저장하지 않는다", async () => {
    const createUserMessage = vi.fn()
    const streaming = createAiStreamingApplication({
      clock: { now: () => now },
      provider: null,
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
  })

  it("owner 권한이 없는 settings mutation을 repository 전에 거절한다", async () => {
    const saveNoticeDocument = vi.fn()
    const settings = createOperationsSettingsApplication({
      readSettings: vi.fn(),
      saveLegalDocument: vi.fn(),
      saveNoticeDocument,
    })
    const result = await settings.noticeCommands.update({
      actor: { ...actor, settingsMutation: "forbidden" },
      document: { announce: "공지", banner: "배너" },
      now,
    })
    expect(result.isErr() && result.error).toEqual({
      kind: "permission-denied",
    })
    expect(saveNoticeDocument).not.toHaveBeenCalled()
  })

  it("관리자 거절은 대상 command를 호출하지 않고 proposal만 rejected로 전이한다", async () => {
    const fixture = createProposalFixture()
    const result = await fixture.application.reviewProposal({
      actor,
      decision: "reject",
      proposalId: fixture.proposal.id,
    })
    expect(result.isOk() && result.value.status).toBe("rejected")
    expect(fixture.applyContentDraft).not.toHaveBeenCalled()
  })

  it("대상 module이 승인을 거절하면 실패를 보존하고 proposal을 재검토 가능 상태로 되돌린다", async () => {
    const fixture = createProposalFixture({ targetDenied: true })
    const result = await fixture.application.reviewProposal({
      actor,
      decision: "approve",
      proposalId: fixture.proposal.id,
    })
    expect(result.isErr() && result.error).toEqual({
      kind: "permission-denied",
    })
    expect(fixture.readCurrent()?.status).toBe("proposed")
  })

  it("같은 conversation의 in-flight 요청과 영속 quota 거절을 구분한다", async () => {
    const consume = vi
      .fn()
      .mockResolvedValueOnce({ kind: "accepted" })
      .mockResolvedValueOnce({
        kind: "rejected",
        reason: "admin-minute",
        retryAfterSeconds: 30,
      })
    const guard = createAiRequestGuard({ repository: { consume } })
    const input = {
      adminId,
      clientIp: "127.0.0.1",
      conversationId,
      now,
    }
    const first = await guard.acquire(input)
    expect(await guard.acquire(input)).toEqual({
      kind: "rejected",
      reason: "in-flight",
      retryAfterSeconds: 1,
    })
    if (first.kind === "accepted") first.release()
    expect(await guard.acquire(input)).toEqual({
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
      return { kind: "accepted" } as const
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
    await expect(guard.acquire(input)).resolves.toEqual({
      kind: "rejected",
      reason: "in-flight",
      retryAfterSeconds: 1,
    })
    expect(consume).toHaveBeenCalledTimes(1)
    releaseQuota()
    const first = await firstPending
    if (first.kind === "accepted") first.release()
  })
})

function createProposalFixture(
  input: { readonly targetDenied?: boolean } = {}
) {
  const proposal: AiChangeProposal = {
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
    reviewedAt: null,
    reviewedByAdminId: null,
    status: "proposed",
  }
  let current: AiChangeProposal | null = proposal
  const repository: AiChangeProposalRepository = {
    async createProposal(created) {
      current = created
    },
    async readProposal() {
      return current
    },
    async transitionProposal(command) {
      if (current?.status !== command.expectedStatus) return "conflict"
      current = command.proposal
      return "updated"
    },
  }
  const applyContentDraft = vi.fn(async () =>
    input.targetDenied
      ? ({ kind: "permission-denied" } as const)
      : ({ kind: "ok" } as const)
  )
  return {
    application: createAiChangeProposalApplication({
      clock: { now: () => now },
      idGenerator: { next: () => proposal.id },
      repository,
      target: {
        applyContentDraft,
        applyResourceDocument: vi.fn(async () => ({ kind: "ok" as const })),
      },
    }),
    applyContentDraft,
    proposal,
    readCurrent: () => current,
  }
}
