import type { AdminId } from "@workspace/types/ids"

export type OperationsActor = Readonly<{
  id: AdminId
  role: "operator" | "owner"
}>
