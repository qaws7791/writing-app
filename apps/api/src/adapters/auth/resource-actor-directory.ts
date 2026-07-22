import { inArray } from "drizzle-orm"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { adminAuthUsers } from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { ResourceActorDirectoryPort } from "@workspace/resource-library/ports"

export function createResourceActorDirectory(
  database: WritingAppDatabase
): ResourceActorDirectoryPort {
  return Object.freeze({
    async readActors(actorIds) {
      const uniqueActorIds = [...new Set(actorIds)]
      if (uniqueActorIds.length === 0) return []

      return database
        .select({
          email: adminAuthUsers.email,
          id: adminAuthUsers.id,
          name: adminAuthUsers.name,
        })
        .from(adminAuthUsers)
        .where(inArray(adminAuthUsers.id, uniqueActorIds))
        .all()
        .map((actor) =>
          Object.freeze({ ...actor, id: adminIdSchema.parse(actor.id) })
        )
    },
  })
}
