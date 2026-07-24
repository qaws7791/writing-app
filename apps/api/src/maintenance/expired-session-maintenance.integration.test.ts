import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import { runApplicationMigrations } from "@/db/migrate"
import { createExpiredSessionMaintenance } from "@/maintenance/expired-session-maintenance"

const cutoff = new Date("2026-07-24T00:00:00.000Z")

describe("만료 session maintenance 실제 SQLite integration", () => {
  it("learner와 admin을 하나의 결정적 bounded batch로 정리한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      runApplicationMigrations(client.sqlite)
      seedSessions(client.sqlite)
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
      expect(readSessionIds(client.sqlite)).toEqual([
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
      expect(readSessionIds(client.sqlite)).toEqual([
        "admin-future",
        "learner-exact",
      ])

      await expect(
        maintenance.cleanup({
          batchSize: 2,
          cutoff,
          dryRun: false,
        })
      ).resolves.toMatchObject({
        value: { deletedSessions: 1, matchedSessions: 1 },
      })
      expect(readSessionIds(client.sqlite)).toEqual(["admin-future"])
    } finally {
      client.close()
    }
  })

  it("invalid cutoff와 batch는 DB를 조회하지 않고 거절한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      const maintenance = createExpiredSessionMaintenance(client.db)

      await expect(
        maintenance.cleanup({
          batchSize: 0,
          cutoff,
          dryRun: false,
        })
      ).resolves.toMatchObject({
        error: { kind: "expired-session-maintenance-failed" },
      })
      await expect(
        maintenance.cleanup({
          batchSize: 1,
          cutoff: new Date(Number.NaN),
          dryRun: false,
        })
      ).resolves.toMatchObject({
        error: { kind: "expired-session-maintenance-failed" },
      })
    } finally {
      client.close()
    }
  })
})

function seedSessions(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    INSERT INTO user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES ('learner', '학습자', 'learner@example.test', 1, NULL, 1, 1);
    INSERT INTO admin_user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES ('admin', '관리자', 'admin@example.test', 1, NULL, 1, 1);
    INSERT INTO session (
      id, user_id, token, expires_at, created_at, updated_at
    ) VALUES
      ('learner-oldest', 'learner', 'learner-oldest-token', 1784851199997, 1, 1),
      ('learner-exact', 'learner', 'learner-exact-token', 1784851200000, 1, 1);
    INSERT INTO admin_session (
      id, user_id, token, expires_at, created_at, updated_at
    ) VALUES
      ('admin-expired', 'admin', 'admin-expired-token', 1784851199998, 1, 1),
      ('admin-future', 'admin', 'admin-future-token', 1784851200001, 1, 1);
  `)
}

function readSessionIds(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): readonly string[] {
  return sqlite
    .query<{ readonly id: string }, []>(
      "SELECT id FROM session UNION ALL SELECT id FROM admin_session ORDER BY id"
    )
    .all()
    .map(({ id }) => id)
}
