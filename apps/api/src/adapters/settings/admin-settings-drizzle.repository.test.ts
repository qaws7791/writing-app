import { describe, expect, it } from "vitest"
import { createWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

import { createAdminSettingsRepository } from "@/adapters/settings/admin-settings-drizzle.repository"

describe("통합 runtime 관리자 settings DB adapter", () => {
  it("notice와 legal 값을 독립 저장하고 마지막 write를 반환한다", async () => {
    const client = createWritingAppDatabase(":memory:")
    const firstNow = new Date("2026-06-14T03:00:00.000Z")
    const secondNow = new Date("2026-06-14T04:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)
      const repository = createAdminSettingsRepository(client.db)

      await expect(repository.readSettings()).resolves.toEqual({
        legal: { privacy: "", terms: "" },
        notice: { announce: "", banner: "" },
      })
      await expect(
        repository.saveNoticeSettings({
          announce: "첫 공지",
          banner: "첫 배너",
          now: firstNow,
        })
      ).resolves.toMatchObject({
        notice: { announce: "첫 공지", banner: "첫 배너" },
      })
      await expect(
        repository.saveLegalSettings({
          now: firstNow,
          privacy: "개인정보처리방침",
          terms: "이용약관",
        })
      ).resolves.toEqual({
        legal: { privacy: "개인정보처리방침", terms: "이용약관" },
        notice: { announce: "첫 공지", banner: "첫 배너" },
      })
      await expect(
        repository.saveNoticeSettings({
          announce: "마지막 공지",
          banner: "마지막 배너",
          now: secondNow,
        })
      ).resolves.toMatchObject({
        notice: { announce: "마지막 공지", banner: "마지막 배너" },
      })
      expect(
        client.sqlite
          .query<{ readonly key: string; readonly updated_at: number }, []>(
            "SELECT key, updated_at FROM admin_settings WHERE key LIKE 'notice.%' ORDER BY key"
          )
          .all()
      ).toEqual([
        { key: "notice.announce", updated_at: secondNow.getTime() },
        { key: "notice.banner", updated_at: secondNow.getTime() },
      ])
    } finally {
      client.close()
    }
  })

  it("두 번째 key write 실패는 notice aggregate 전체를 rollback한다", async () => {
    const client = createWritingAppDatabase(":memory:")

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
      await expect(repository.readSettings()).resolves.toEqual({
        legal: { privacy: "", terms: "" },
        notice: { announce: "", banner: "" },
      })
    } finally {
      client.close()
    }
  })
})
