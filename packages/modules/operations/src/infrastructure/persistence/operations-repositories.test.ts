import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createWritingAppDatabase } from "@workspace/db/client"
import { runBaselineTestMigration } from "@workspace/db/test-support/application-migration"
import type {
  AdminId,
  AiChangeProposalId,
  CourseId,
} from "@workspace/types/ids"

import { createAiChangeProposalRepository } from "#operations/infrastructure/persistence/ai-change-proposal-repository"
import { createAiConversationRepository } from "#operations/infrastructure/persistence/ai-conversation-repository"
import { createAiQuotaRepository } from "#operations/infrastructure/persistence/ai-quota-repository"
import { createOperationsSettingsRepository } from "#operations/infrastructure/persistence/operations-settings-repository"
import { runOperationsSchemaMigration } from "#operations/infrastructure/persistence/schema-migration"

const now = new Date("2026-07-23T00:00:00.000Z")
const adminId = "admin-1" as AdminId

describe("operations temporary SQLite repositories", () => {
  it("legacy row를 보존하며 cross-module admin FK를 제거하고 module table을 만든다", async () => {
    await withTemporaryOperationsDatabase(async ({ database, sqlite }) => {
      const foreignTables = sqlite
        .query<{ readonly table: string }, []>(
          "PRAGMA foreign_key_list(admin_ai_chat_conversations)"
        )
        .all()
        .map((row) => row.table)
      expect(foreignTables).not.toContain("admin_user")
      expect(
        sqlite
          .query<{ readonly title: string }, []>(
            "SELECT title FROM admin_ai_chat_conversations WHERE id = 'conversation-legacy'"
          )
          .get()
      ).toEqual({ title: "기존 대화" })
      expect(readTables(sqlite)).toEqual(
        expect.arrayContaining([
          "admin_settings",
          "admin_ai_chat_conversations",
          "admin_ai_chat_messages",
          "operations_ai_change_proposals",
          "operations_ai_quota_counters",
        ])
      )

      const settings = createOperationsSettingsRepository(database)
      await settings.saveNoticeDocument({
        announce: "공지",
        banner: "배너",
        now,
      })
      await expect(settings.readSettings()).resolves.toMatchObject({
        notice: { announce: "공지", banner: "배너" },
      })
    })
  })

  it("conversation 소유권, proposal CAS와 영속 quota를 repository별로 보존한다", async () => {
    await withTemporaryOperationsDatabase(async ({ database }) => {
      const conversations = createAiConversationRepository(database)
      const history = await conversations.createUserMessage({
        adminId,
        conversationId: null,
        message: "강의 제목을 바꿔 줘",
        now,
      })
      expect(history?.messages).toHaveLength(1)
      const conversationId = history?.conversation.conversation.id
      if (conversationId === undefined) throw new Error("대화 생성 실패")
      await expect(
        conversations.readConversation({
          adminId: "admin-2" as AdminId,
          conversationId,
          messagePage: 1,
          messagePageSize: 100,
        })
      ).resolves.toBeNull()

      const proposals = createAiChangeProposalRepository(database)
      const proposal = {
        change: {
          courseId: "course-1" as CourseId,
          expectedEditVersion: 1,
          kind: "content-course-draft" as const,
          title: "새 제목",
        },
        conversationId,
        createdAt: now,
        createdByAdminId: adminId,
        id: "proposal-1" as AiChangeProposalId,
        reviewedAt: null,
        reviewedByAdminId: null,
        status: "proposed" as const,
      }
      await proposals.createProposal(proposal)
      await expect(proposals.readProposal(proposal.id)).resolves.toEqual(
        proposal
      )
      await expect(
        proposals.transitionProposal({
          expectedStatus: "approved",
          proposal: { ...proposal, status: "rejected" },
        })
      ).resolves.toBe("conflict")

      const quotaInput = {
        adminId,
        clientIp: "127.0.0.1",
        limits: { dailyAdmin: 10, minuteAdmin: 1, minuteIp: 10 },
        now,
      }
      await expect(
        createAiQuotaRepository(database).consume(quotaInput)
      ).resolves.toEqual({ kind: "accepted" })
      await expect(
        createAiQuotaRepository(database).consume(quotaInput)
      ).resolves.toEqual({
        kind: "rejected",
        reason: "admin-minute",
        retryAfterSeconds: 60,
      })
    })
  })
})

async function withTemporaryOperationsDatabase(
  run: (input: {
    readonly database: ReturnType<typeof createWritingAppDatabase>["db"]
    readonly sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"]
  }) => Promise<void>
) {
  const directory = mkdtempSync(join(tmpdir(), "writing-app-operations-"))
  const client = createWritingAppDatabase(join(directory, "operations.sqlite"))
  try {
    runBaselineTestMigration(client.sqlite)
    client.sqlite
      .query<unknown, [string, string, string, number, number]>(`
        INSERT INTO admin_user (
          id, name, email, email_verified, role, created_at, updated_at
        ) VALUES (?, ?, ?, 1, 'owner', ?, ?)
      `)
      .run(adminId, "관리자", "admin@example.com", now.getTime(), now.getTime())
    client.sqlite.exec(`
      INSERT INTO admin_ai_chat_conversations (
        id, title, admin_id, created_at, updated_at
      ) VALUES (
        'conversation-legacy', '기존 대화', 'admin-1', ${now.getTime()}, ${now.getTime()}
      );
    `)
    runOperationsSchemaMigration(client.sqlite)
    runOperationsSchemaMigration(client.sqlite)
    await run({ database: client.db, sqlite: client.sqlite })
  } finally {
    client.close()
    rmSync(directory, { force: true, recursive: true })
  }
}

function readTables(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"]
): string[] {
  return sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table'"
    )
    .all()
    .map((row) => row.name)
}
