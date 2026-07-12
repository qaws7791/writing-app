import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { createWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { createAdminSettingsRepository } from "#core/modules/admin/infrastructure/persistence/admin-settings-drizzle.repository"

describe.each(["메모리", "파일"] as const)(
  "어드민 설정 repository %s DB",
  (databaseKind) => {
    it("두 번째 설정 쓰기가 실패하면 aggregate 전체를 rollback한다", async () => {
      const temporaryDirectory = mkdtempSync(
        join(tmpdir(), "writing-settings-")
      )
      const databaseUrl =
        databaseKind === "메모리"
          ? ":memory:"
          : join(temporaryDirectory, "settings.sqlite")
      const client = createWritingAppDatabase(databaseUrl)

      try {
        runBaselineMigration(client.sqlite)
        client.sqlite.exec(`
          CREATE TRIGGER fail_notice_banner_write
          BEFORE INSERT ON admin_settings
          WHEN NEW.key = 'notice.banner'
          BEGIN
            SELECT RAISE(FAIL, 'injected second write failure');
          END;
        `)
        const repository = createAdminSettingsRepository(client.db)

        await expect(
          Promise.resolve().then(() =>
            repository.saveNoticeSettings({
              announce: "첫 번째 쓰기",
              banner: "실패할 두 번째 쓰기",
              now: new Date("2026-07-12T00:00:00.000Z"),
            })
          )
        ).rejects.toThrow("injected second write failure")
        await expect(repository.readSettings()).resolves.toMatchObject({
          notice: { announce: "", banner: "" },
        })
      } finally {
        client.close()
      }
    })

    it("성공과 같은 입력 재시도는 같은 값과 갱신 시점을 유지한다", async () => {
      const temporaryDirectory = mkdtempSync(
        join(tmpdir(), "writing-settings-")
      )
      const databaseUrl =
        databaseKind === "메모리"
          ? ":memory:"
          : join(temporaryDirectory, "settings.sqlite")
      const client = createWritingAppDatabase(databaseUrl)

      try {
        runBaselineMigration(client.sqlite)
        const repository = createAdminSettingsRepository(client.db)
        const input = {
          announce: "운영 공지",
          banner: "상단 배너",
          now: new Date("2026-07-12T00:00:00.000Z"),
        }

        const firstResult = await repository.saveNoticeSettings(input)
        const retriedResult = await repository.saveNoticeSettings(input)
        const updatedTimes = client.sqlite
          .query<{ updated_at: number }, []>(
            "SELECT updated_at FROM admin_settings WHERE key LIKE 'notice.%' ORDER BY key"
          )
          .all()

        expect(retriedResult).toEqual(firstResult)
        expect(updatedTimes).toEqual([
          { updated_at: input.now.getTime() },
          { updated_at: input.now.getTime() },
        ])
      } finally {
        client.close()
      }
    })
  }
)
