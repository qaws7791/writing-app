import type { AdminId } from "@workspace/types/ids"

export type ResourceActor = Readonly<{
  access: "allowed" | "forbidden"
  email: string
  id: AdminId
  name: string
}>

export type ResourceActorProfile = Readonly<{
  email: string
  id: AdminId
  name: string
}>

export function authorizeResourceAccess(
  actor: ResourceActor
): "allowed" | "forbidden" {
  return actor.access
}
