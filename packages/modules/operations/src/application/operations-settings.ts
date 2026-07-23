import { err, ok, type Result } from "@workspace/kernel/result"

import type { OperationsActor } from "#operations/domain/operations-actor"
import { authorizeSettingsMutation } from "#operations/domain/operations-actor"
import type { OperationsError } from "#operations/domain/operations-error"
import type {
  LegalDocument,
  NoticeDocument,
  OperationsSettings,
} from "#operations/domain/operations-settings"
import {
  validateLegalDocument,
  validateNoticeDocument,
} from "#operations/domain/operations-settings"
import type { OperationsSettingsRepository } from "#operations/application/ports/operations-ports"

export type OperationsSettingsApplication = Readonly<{
  legalCommands: Readonly<{
    update: (
      input: Readonly<{
        actor: OperationsActor
        document: LegalDocument
        now: Date
      }>
    ) => Promise<Result<OperationsSettings, OperationsError>>
  }>
  noticeCommands: Readonly<{
    update: (
      input: Readonly<{
        actor: OperationsActor
        document: NoticeDocument
        now: Date
      }>
    ) => Promise<Result<OperationsSettings, OperationsError>>
  }>
  queries: Readonly<{
    read: () => Promise<Result<OperationsSettings, OperationsError>>
  }>
}>

export function createOperationsSettingsApplication(
  repository: OperationsSettingsRepository
): OperationsSettingsApplication {
  return Object.freeze({
    legalCommands: Object.freeze({
      update: async (
        input: Parameters<
          OperationsSettingsApplication["legalCommands"]["update"]
        >[0]
      ): Promise<Result<OperationsSettings, OperationsError>> => {
        if (authorizeSettingsMutation(input.actor) === "forbidden") {
          return err({ kind: "permission-denied" } as const)
        }
        const validation = validateLegalDocument(input.document)
        if (validation.kind === "invalid") return err(validation.error)
        try {
          return ok(
            await repository.saveLegalDocument({
              ...input.document,
              now: input.now,
            })
          )
        } catch {
          return err({
            kind: "persistence-failed",
            operation: "save-legal-document",
          })
        }
      },
    }),
    noticeCommands: Object.freeze({
      update: async (
        input: Parameters<
          OperationsSettingsApplication["noticeCommands"]["update"]
        >[0]
      ): Promise<Result<OperationsSettings, OperationsError>> => {
        if (authorizeSettingsMutation(input.actor) === "forbidden") {
          return err({ kind: "permission-denied" } as const)
        }
        const validation = validateNoticeDocument(input.document)
        if (validation.kind === "invalid") return err(validation.error)
        try {
          return ok(
            await repository.saveNoticeDocument({
              ...input.document,
              now: input.now,
            })
          )
        } catch {
          return err({
            kind: "persistence-failed",
            operation: "save-notice-document",
          })
        }
      },
    }),
    queries: Object.freeze({
      read: async (): Promise<Result<OperationsSettings, OperationsError>> => {
        try {
          return ok(await repository.readSettings())
        } catch {
          return err({
            kind: "persistence-failed",
            operation: "read-settings",
          })
        }
      },
    }),
  })
}
