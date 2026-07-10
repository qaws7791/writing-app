import { z } from "zod"

import { adminResourceRevisionSchema } from "@workspace/contracts/admin/admin-resource-library-shared"

export const adminResourceDocumentTransactionIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/u)

export const adminResourceYjsUpdateBase64Schema = z
  .string()
  .min(4)
  .max(699_052)
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u)

const adminResourceYjsSnapshotBase64Schema = z
  .string()
  .min(4)
  .max(4_000_000)
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
