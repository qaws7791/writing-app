import { z } from "zod"

import {
  adminResourceDocumentIdSchema,
  adminResourceFolderIdSchema,
  adminResourceIdSchema,
  adminResourceNameSchema,
  adminResourceRevisionSchema,
} from "@workspace/contracts/admin/admin-resource-library-shared"

export const adminResourceTreeMutationActionSchema = z.enum([
  "create-document",
  "create-folder",
  "import-document",
  "move",
  "rename",
  "restore",
  "trash",
])

export const adminResourceTreeMutationEventSchema = z.object({
  action: adminResourceTreeMutationActionSchema,
  affectedParentIds: z.array(adminResourceFolderIdSchema.nullable()),
  nodeId: adminResourceIdSchema,
  revision: adminResourceRevisionSchema,
  type: z.literal("resource-tree-mutated"),
})

export const adminResourceDocumentTitleConfirmedEventSchema = z.object({
  documentId: adminResourceDocumentIdSchema,
  name: adminResourceNameSchema,
  revision: adminResourceRevisionSchema,
  type: z.literal("resource-document-title-confirmed"),
})

export const adminResourceDocumentSubscriptionConfirmedEventSchema = z.object({
  documentId: adminResourceDocumentIdSchema,
  stateVersion: adminResourceRevisionSchema,
  type: z.literal("resource-document-subscription-confirmed"),
})

export const adminResourceDocumentVersionAdvancedEventSchema = z.object({
  contentRevision: adminResourceRevisionSchema,
  documentId: adminResourceDocumentIdSchema,
  stateVersion: adminResourceRevisionSchema,
  type: z.literal("resource-document-version-advanced"),
})

export const adminResourceDocumentInvalidatedEventSchema = z.object({
  documentId: adminResourceDocumentIdSchema,
  reason: z.enum(["archived", "projection-failed"]),
  type: z.literal("resource-document-invalidated"),
})

export const adminResourceStateVersionSchema = adminResourceRevisionSchema

export const adminResourceDocumentSubscribeMessageSchema = z.object({
  documentId: adminResourceDocumentIdSchema,
  knownStateVersion: adminResourceStateVersionSchema,
  type: z.literal("resource-document-subscribe"),
})

export const adminResourceDocumentUnsubscribeMessageSchema = z.object({
  documentId: adminResourceDocumentIdSchema,
  type: z.literal("resource-document-unsubscribe"),
})

export const adminResourceRealtimeHeartbeatMessageSchema = z.object({
  sentAt: z.iso.datetime(),
  type: z.literal("resource-realtime-heartbeat"),
})

export const adminResourceRealtimeClientMessageSchema = z.discriminatedUnion(
  "type",
  [
    adminResourceDocumentSubscribeMessageSchema,
    adminResourceDocumentUnsubscribeMessageSchema,
    adminResourceRealtimeHeartbeatMessageSchema,
  ]
)

export const adminResourceEventSchema = z.discriminatedUnion("type", [
  adminResourceTreeMutationEventSchema,
  adminResourceDocumentTitleConfirmedEventSchema,
])

export const adminResourceRealtimeServerMessageSchema = z.discriminatedUnion(
  "type",
  [
    adminResourceTreeMutationEventSchema,
    adminResourceDocumentTitleConfirmedEventSchema,
    adminResourceDocumentSubscriptionConfirmedEventSchema,
    adminResourceDocumentVersionAdvancedEventSchema,
    adminResourceDocumentInvalidatedEventSchema,
  ]
)

export type AdminResourceEvent = z.infer<typeof adminResourceEventSchema>
export type AdminResourceRealtimeClientMessage = z.infer<
  typeof adminResourceRealtimeClientMessageSchema
>
export type AdminResourceRealtimeServerMessage = z.infer<
  typeof adminResourceRealtimeServerMessageSchema
>
export type AdminResourceTreeMutationAction = z.infer<
  typeof adminResourceTreeMutationActionSchema
>
