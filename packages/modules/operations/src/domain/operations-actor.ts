import type { AdminId } from "@workspace/types/ids"

export type OperationsActor = Readonly<{
  email: string
  id: AdminId
  name: string
  settingsMutation: "allowed" | "forbidden"
}>

export function authorizeSettingsMutation(
  actor: OperationsActor
): "allowed" | "forbidden" {
  return actor.settingsMutation
}
