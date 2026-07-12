import type {
  AdminResourceEvent,
  AdminResourceRealtimeMessage,
} from "@/features/resources/resource-library-model"
import {
  adminResourceEventSchema,
  adminResourceRealtimeServerMessageSchema,
} from "@workspace/contracts/admin"

export function parseAdminResourceEvent(
  value: unknown
): AdminResourceEvent | null {
  const result = adminResourceEventSchema.safeParse(value)
  if (!result.success) return null
  return result.data.type === "resource-tree-mutated"
    ? {
        action: result.data.action,
        affectedParentIds: [...result.data.affectedParentIds],
        nodeId: result.data.nodeId,
        revision: result.data.revision,
        type: result.data.type,
      }
    : { ...result.data }
}

export function parseAdminResourceRealtimeMessage(
  value: unknown
): AdminResourceRealtimeMessage | null {
  const result = adminResourceRealtimeServerMessageSchema.safeParse(value)
  if (!result.success) return null
  const resourceEvent = parseAdminResourceEvent(result.data)
  if (resourceEvent !== null) return resourceEvent
  switch (result.data.type) {
    case "resource-document-subscription-confirmed":
    case "resource-document-version-advanced":
    case "resource-document-invalidated":
      return { ...result.data }
    default:
      return null
  }
}
