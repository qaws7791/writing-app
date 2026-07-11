import { z } from "zod"

import { adminResourceRevisionSchema } from "@workspace/contracts/admin/admin-resource-library-shared"

export const adminResourceYjsUpdateMaxBytes = 512 * 1024
export const adminResourceYjsSnapshotMaxBytes = 3_000_000
export const adminResourceDocumentMaxNodes = 20_000
export const adminResourceDocumentMaxTransactions = 10_000
export const adminResourceDocumentProjectionTimeoutMilliseconds = 1_000
export const adminResourceDocumentReceiptRetentionMilliseconds =
  7 * 24 * 60 * 60 * 1_000

export const adminResourceDocumentTransactionIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/u)

export const adminResourceYjsUpdateBase64Schema = z
  .string()
  .min(4)
  .max(Math.ceil(adminResourceYjsUpdateMaxBytes / 3) * 4)
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u)

export const adminResourceYjsSnapshotBase64Schema = z
  .string()
  .min(4)
  .max(Math.ceil(adminResourceYjsSnapshotMaxBytes / 3) * 4)
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u)

export const adminSaveResourceDocumentTransactionRequestSchema = z.object({
  knownStateVersion: adminResourceRevisionSchema,
  transactionId: adminResourceDocumentTransactionIdSchema,
  updateBase64: adminResourceYjsUpdateBase64Schema,
})

const adminSavedResourceDocumentTransactionSchema = z.object({
  contentRevision: adminResourceRevisionSchema,
  stateVersion: adminResourceRevisionSchema,
  transactionId: adminResourceDocumentTransactionIdSchema,
})

export const adminSaveResourceDocumentTransactionResponseSchema =
  z.discriminatedUnion("kind", [
    adminSavedResourceDocumentTransactionSchema.extend({
      kind: z.literal("accepted"),
    }),
    adminSavedResourceDocumentTransactionSchema.extend({
      kind: z.literal("already-accepted"),
    }),
  ])

export const adminReadResourceDocumentSyncQuerySchema = z.object({
  afterStateVersion: z.coerce.number().int().nonnegative(),
  mode: z.enum(["incremental", "snapshot"]).default("incremental"),
})

export const adminReadResourceDocumentSyncResponseSchema = z.discriminatedUnion(
  "kind",
  [
    z.object({
      kind: z.literal("up-to-date"),
      stateVersion: adminResourceRevisionSchema,
    }),
    z.object({
      fromStateVersion: adminResourceRevisionSchema,
      kind: z.literal("updates"),
      stateVersion: adminResourceRevisionSchema,
      updatesBase64: z.array(adminResourceYjsUpdateBase64Schema),
    }),
    z.object({
      kind: z.literal("snapshot"),
      snapshotBase64: adminResourceYjsSnapshotBase64Schema,
      stateVersion: adminResourceRevisionSchema,
    }),
  ]
)

export type AdminSaveResourceDocumentTransactionRequest = z.infer<
  typeof adminSaveResourceDocumentTransactionRequestSchema
>
export type AdminSaveResourceDocumentTransactionResponse = z.infer<
  typeof adminSaveResourceDocumentTransactionResponseSchema
>
export type AdminReadResourceDocumentSyncResponse = z.infer<
  typeof adminReadResourceDocumentSyncResponseSchema
>
