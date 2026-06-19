import type { AdminSettingsDto } from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  SaveAdminLegalSettingsInput,
  SaveAdminNoticeSettingsInput,
  SettingsRepository,
} from "@workspace/core/modules/admin/application/ports/admin.repository"

import type { WritingAppDatabase } from "@workspace/db/client"
import { adminSettings } from "@workspace/db/schema"

export function createAdminSettingsRepository(
  db: WritingAppDatabase
): SettingsRepository {
  return {
    readSettings() {
      return Promise.resolve(readSettings(db))
    },
    saveLegalSettings(input) {
      return Promise.resolve(saveLegalSettings(db, input))
    },
    saveNoticeSettings(input) {
      return Promise.resolve(saveNoticeSettings(db, input))
    },
  }
}

const settingsKeys = {
  announce: "notice.announce",
  banner: "notice.banner",
  privacy: "legal.privacy",
  terms: "legal.terms",
} as const

function readSettings(db: WritingAppDatabase): AdminSettingsDto {
  const rows = db.select().from(adminSettings).all()
  const values = new Map(rows.map((row) => [row.key, row.value]))

  return {
    legal: {
      privacy: values.get(settingsKeys.privacy) ?? "",
      terms: values.get(settingsKeys.terms) ?? "",
    },
    notice: {
      announce: values.get(settingsKeys.announce) ?? "",
      banner: values.get(settingsKeys.banner) ?? "",
    },
  }
}

function saveNoticeSettings(
  db: WritingAppDatabase,
  input: SaveAdminNoticeSettingsInput
): AdminSettingsDto {
  saveSettingRows(db, input.now, [
    [settingsKeys.announce, input.announce],
    [settingsKeys.banner, input.banner],
  ])

  return readSettings(db)
}

function saveLegalSettings(
  db: WritingAppDatabase,
  input: SaveAdminLegalSettingsInput
): AdminSettingsDto {
  saveSettingRows(db, input.now, [
    [settingsKeys.privacy, input.privacy],
    [settingsKeys.terms, input.terms],
  ])

  return readSettings(db)
}

function saveSettingRows(
  db: WritingAppDatabase,
  now: Date,
  rows: readonly (readonly [key: string, value: string])[]
): void {
  for (const [key, value] of rows) {
    db.insert(adminSettings)
      .values({
        key,
        updatedAt: now,
        value,
      })
      .onConflictDoUpdate({
        set: {
          updatedAt: now,
          value,
        },
        target: adminSettings.key,
      })
      .run()
  }
}
