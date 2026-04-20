import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export function getDb() {
  return getAdminRuntime().database.db
}
