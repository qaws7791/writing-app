import type { WritingAppDatabase } from "@workspace/db/client"

import type { OperationsSettingsRepository } from "#operations/application/ports/operations-ports"
import type { OperationsSettings } from "#operations/domain/operations-settings"
import { operationsSettings } from "#operations/infrastructure/persistence/schema"

const settingsKeys = {
  announce: "notice.announce",
  banner: "notice.banner",
  privacy: "legal.privacy",
  terms: "legal.terms",
} as const

export function createOperationsSettingsRepository(
  database: WritingAppDatabase
): OperationsSettingsRepository {
  return Object.freeze({
    async readSettings() {
      return readSettings(database)
    },
    async saveLegalDocument(input) {
      database.transaction((transaction) => {
        saveSettings(transaction, input.now, [
          [settingsKeys.privacy, input.privacy],
          [settingsKeys.terms, input.terms],
        ])
      })
      return readSettings(database)
    },
    async saveNoticeDocument(input) {
      database.transaction((transaction) => {
        saveSettings(transaction, input.now, [
          [settingsKeys.announce, input.announce],
          [settingsKeys.banner, input.banner],
        ])
      })
      return readSettings(database)
    },
  })
}

function readSettings(database: WritingAppDatabase): OperationsSettings {
  const values = new Map(
    database
      .select()
      .from(operationsSettings)
      .all()
      .map((row) => [row.key, row.value])
  )
  return Object.freeze({
    legal: Object.freeze({
      privacy: values.get(settingsKeys.privacy) ?? "",
      terms: values.get(settingsKeys.terms) ?? "",
    }),
    notice: Object.freeze({
      announce: values.get(settingsKeys.announce) ?? "",
      banner: values.get(settingsKeys.banner) ?? "",
    }),
  })
}

function saveSettings(
  database: Pick<WritingAppDatabase, "insert">,
  now: Date,
  values: readonly (readonly [string, string])[]
): void {
  for (const [key, value] of values) {
    database
      .insert(operationsSettings)
      .values({ key, updatedAt: now, value })
      .onConflictDoUpdate({
        set: { updatedAt: now, value },
        target: operationsSettings.key,
      })
      .run()
  }
}
