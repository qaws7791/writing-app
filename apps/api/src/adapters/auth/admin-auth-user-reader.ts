import { adminAuthUsers } from "@workspace/auth/schema"
import { chunkByBoundParameters } from "@workspace/db/bound-parameter-chunks"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { AdminId } from "@workspace/types/ids"
import { inArray } from "drizzle-orm"

export function findMissingAdminAuthUserIds(
  database: WritingAppDatabase,
  adminIds: readonly AdminId[]
): readonly AdminId[] {
  const uniqueAdminIds = [...new Set(adminIds)]
  if (uniqueAdminIds.length === 0) return []

  const existingAdminIds = new Set(
    chunkByBoundParameters(uniqueAdminIds, {
      fixedParameters: 0,
      parametersPerItem: 1,
    }).flatMap((adminIdChunk) =>
      database
        .select({ id: adminAuthUsers.id })
        .from(adminAuthUsers)
        .where(inArray(adminAuthUsers.id, adminIdChunk))
        .all()
        .map((row) => row.id)
    )
  )

  return uniqueAdminIds.filter((adminId) => !existingAdminIds.has(adminId))
}
