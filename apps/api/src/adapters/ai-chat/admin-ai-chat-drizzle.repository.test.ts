import { describe, expect, it } from "vitest"

import { adminIdSchema } from "@workspace/contracts/identity/data"
import { createWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { adminAuthUsers } from "@workspace/db/schema"

import { createAdminAiChatRepository } from "@/adapters/ai-chat/admin-ai-chat-drizzle.repository"

describe("통합 runtime 관리자 AI chat SQLite repository", () => {
  it("대화와 메시지를 순서대로 저장하고 다른 관리자의 접근을 격리한다", async () => {
    const client = createWritingAppDatabase(":memory:")
    const adminId = adminIdSchema.parse("admin-1")
    const otherAdminId = adminIdSchema.parse("admin-2")
    const startedAt = new Date("2026-07-17T01:00:00.000Z")
    const answeredAt = new Date("2026-07-17T01:00:01.000Z")
    const secondConversationAt = new Date("2026-07-17T01:00:02.000Z")
    const followedUpAt = new Date("2026-07-17T01:00:03.000Z")

    try {
      runBaselineMigration(client.sqlite)
      client.db
        .insert(adminAuthUsers)
        .values([
          {
            createdAt: startedAt,
            email: "admin-1@example.com",
            emailVerified: true,
            id: adminId,
            name: "첫 관리자",
            role: "owner",
            updatedAt: startedAt,
          },
          {
            createdAt: startedAt,
            email: "admin-2@example.com",
            emailVerified: true,
            id: otherAdminId,
            name: "다른 관리자",
            role: "operator",
            updatedAt: startedAt,
          },
        ])
        .run()
      const repository = createAdminAiChatRepository(client.db)

      const created = await repository.createAiChatUserMessage({
        adminId,
        conversationId: null,
        message: "  첫   운영 질문  ",
        now: startedAt,
      })

      expect(created).toMatchObject({
        conversation: {
          createdAt: startedAt.toISOString(),
          messageCount: 1,
          title: "첫 운영 질문",
          updatedAt: startedAt.toISOString(),
        },
        messageItems: [
          {
            content: "  첫   운영 질문  ",
            createdAt: startedAt.toISOString(),
            role: "user",
          },
        ],
      })
      if (created === null) {
        throw new Error("AI chat 대화 fixture 생성에 실패했습니다.")
      }
      expect(created.conversation.id).toMatch(/^admin-ai-chat-/u)
      expect(created.messageItems[0]?.id).toMatch(/^admin-ai-message-/u)

      const assistantMessage = await repository.saveAiChatAssistantMessage({
        content: "첫 운영 답변",
        conversationId: created.conversation.id,
        now: answeredAt,
      })
      expect(assistantMessage).toMatchObject({
        content: "첫 운영 답변",
        createdAt: answeredAt.toISOString(),
        role: "assistant",
      })
      expect(assistantMessage.id).toMatch(/^admin-ai-message-/u)
      await expect(
        repository.readAiChatConversation({
          adminId,
          conversationId: created.conversation.id,
          messagePage: 1,
          messagePageSize: 10,
        })
      ).resolves.toMatchObject({
        conversation: {
          messageCount: 2,
          updatedAt: answeredAt.toISOString(),
        },
        messageItems: [
          { content: "  첫   운영 질문  ", role: "user" },
          { content: "첫 운영 답변", role: "assistant" },
        ],
      })
      await expect(
        repository.readAiChatConversations({
          adminId,
          page: 1,
          pageSize: 10,
        })
      ).resolves.toMatchObject([
        {
          id: created.conversation.id,
          messageCount: 2,
          updatedAt: answeredAt.toISOString(),
        },
      ])
      await expect(
        repository.readAiChatConversation({
          adminId: otherAdminId,
          conversationId: created.conversation.id,
          messagePage: 1,
          messagePageSize: 10,
        })
      ).resolves.toBeNull()
      await expect(
        repository.createAiChatUserMessage({
          adminId: otherAdminId,
          conversationId: created.conversation.id,
          message: "격리되어야 하는 질문",
          now: answeredAt,
        })
      ).resolves.toBeNull()

      const secondConversation = await repository.createAiChatUserMessage({
        adminId,
        conversationId: null,
        message: "  12345678901234567890123456789012345678901  ",
        now: secondConversationAt,
      })
      if (secondConversation === null) {
        throw new Error("두 번째 AI chat 대화 fixture 생성에 실패했습니다.")
      }
      expect(secondConversation.conversation.title).toBe(
        "1234567890123456789012345678901234567890..."
      )
      await expect(
        repository.readAiChatConversations({
          adminId,
          page: 1,
          pageSize: 1,
        })
      ).resolves.toMatchObject([{ id: secondConversation.conversation.id }])
      await expect(
        repository.readAiChatConversations({
          adminId,
          page: 2,
          pageSize: 1,
        })
      ).resolves.toMatchObject([{ id: created.conversation.id }])
      await expect(
        repository.readAiChatConversation({
          adminId,
          conversationId: created.conversation.id,
          messagePage: 1,
          messagePageSize: 1,
        })
      ).resolves.toMatchObject({
        messageItems: [{ content: "첫 운영 답변", role: "assistant" }],
      })
      await expect(
        repository.readAiChatConversation({
          adminId,
          conversationId: created.conversation.id,
          messagePage: 2,
          messagePageSize: 1,
        })
      ).resolves.toMatchObject({
        messageItems: [{ content: "  첫   운영 질문  ", role: "user" }],
      })

      await expect(
        repository.createAiChatUserMessage({
          adminId,
          conversationId: created.conversation.id,
          message: "후속 운영 질문",
          now: followedUpAt,
        })
      ).resolves.toMatchObject({
        conversation: {
          messageCount: 3,
          updatedAt: followedUpAt.toISOString(),
        },
        messageItems: [
          { content: "  첫   운영 질문  ", role: "user" },
          { content: "첫 운영 답변", role: "assistant" },
          { content: "후속 운영 질문", role: "user" },
        ],
      })
    } finally {
      client.close()
    }
  })
})
