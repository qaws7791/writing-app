import { describe, expect, it, vi } from "vitest"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"

import { runApplicationMigrations } from "@/db/migrate"
import { createExpiredSessionMaintenance } from "@/maintenance/expired-session-maintenance"

const cutoff = new Date("2026-07-24T00:00:00.000Z")

describe("만료 session maintenance 실제 SQLite integration", () => {
  it("learner와 admin을 하나의 결정적 bounded batch로 정리한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      runApplicationMigrations(client.sqlite)
      seedSessions(client)
      const maintenance = createExpiredSessionMaintenance(client.db)

      await expect(
        maintenance.cleanup({
          batchSize: 2,
          cutoff,
          dryRun: true,
        })
      ).resolves.toMatchObject({
        value: { deletedSessions: 0, matchedSessions: 2 },
      })
      expect(readSessionIds(client)).toEqual([
        "admin-expired",
        "admin-future",
        "learner-exact",
        "learner-oldest",
      ])

      await expect(
        maintenance.cleanup({
          batchSize: 2,
          cutoff,
          dryRun: false,
        })
      ).resolves.toMatchObject({
        value: { deletedSessions: 2, matchedSessions: 2 },
      })
      expect(readSessionIds(client)).toEqual(["admin-future", "learner-exact"])

      await expect(
        maintenance.cleanup({
          batchSize: 2,
          cutoff,
          dryRun: false,
        })
      ).resolves.toMatchObject({
        value: { deletedSessions: 1, matchedSessions: 1 },
      })
      expect(readSessionIds(client)).toEqual(["admin-future"])
    } finally {
      client.close()
    }
  })

  it.each([
    ["batch size가 1보다 작으면", 0, cutoff],
    ["cutoff가 유효한 시각이 아니면", 1, new Date(Number.NaN)],
  ] as const)(
    "%s 정상 DB에서도 session을 조회하지 않고 거절한다",
    async (_reason, batchSize, invalidCutoff) => {
      const client = createInMemoryWritingAppDatabase()
      try {
        runApplicationMigrations(client.sqlite)
        seedSessions(client)
        const selectSpy = vi.spyOn(client.db, "select")
        const maintenance = createExpiredSessionMaintenance(client.db)

        await expect(
          maintenance.cleanup({
            batchSize,
            cutoff: invalidCutoff,
            dryRun: false,
          })
        ).resolves.toMatchObject({
          error: { kind: "expired-session-maintenance-failed" },
        })
        expect(selectSpy).not.toHaveBeenCalled()
        expect(readSessionIds(client)).toHaveLength(4)

        // 같은 spy가 정상 입력에서는 조회를 관찰함을 확인해 위 단정이 공허하지 않게 한다.
        await maintenance.cleanup({ batchSize: 1, cutoff, dryRun: true })
        expect(selectSpy).toHaveBeenCalled()
      } finally {
        client.close()
      }
    }
  )
})

function seedSessions(client: WritingAppDatabaseClient): void {
  const expiredBeforeCutoff = cutoff.getTime() - 3
  const adminExpiredBeforeCutoff = cutoff.getTime() - 2
  const expiresAtCutoff = cutoff.getTime()
  const expiresAfterCutoff = cutoff.getTime() + 1

  client.sqlite.exec(`
    INSERT INTO user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES ('learner', '학습자', 'learner@example.test', 1, NULL, 1, 1);
    INSERT INTO admin_user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES ('admin', '관리자', 'admin@example.test', 1, NULL, 1, 1);
    INSERT INTO session (
      id, user_id, token, expires_at, created_at, updated_at
    ) VALUES
      ('learner-oldest', 'learner', 'learner-oldest-token', ${expiredBeforeCutoff}, 1, 1),
      ('learner-exact', 'learner', 'learner-exact-token', ${expiresAtCutoff}, 1, 1);
    INSERT INTO admin_session (
      id, user_id, token, expires_at, created_at, updated_at
    ) VALUES
      ('admin-expired', 'admin', 'admin-expired-token', ${adminExpiredBeforeCutoff}, 1, 1),
      ('admin-future', 'admin', 'admin-future-token', ${expiresAfterCutoff}, 1, 1);
  `)
}

function readSessionIds(client: WritingAppDatabaseClient): readonly string[] {
  return client.sqlite
    .query<{ readonly id: string }, []>(
      "SELECT id FROM session UNION ALL SELECT id FROM admin_session ORDER BY id"
    )
    .all()
    .map(({ id }) => id)
}
