import { asc, eq } from "drizzle-orm"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { authUsers } from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  AuthenticatedLearnerIdentity,
  LearnerIdentityDirectoryPort,
} from "@workspace/identity/ports"

export function createLearnerIdentityDirectory(
  database: WritingAppDatabase
): LearnerIdentityDirectoryPort {
  return {
    async findLearnerIdentity(userId) {
      const row = database
        .select()
        .from(authUsers)
        .where(eq(authUsers.id, userId))
        .get()

      return row === undefined ? null : toLearnerIdentity(row)
    },
    async listLearnerIdentities() {
      return database
        .select()
        .from(authUsers)
        .orderBy(asc(authUsers.id))
        .all()
        .map(toLearnerIdentity)
    },
  }
}

function toLearnerIdentity(
  row: typeof authUsers.$inferSelect
): AuthenticatedLearnerIdentity {
  return {
    email: row.email,
    id: userIdSchema.parse(row.id),
    image: row.image,
    joinedAt: new Date(row.createdAt),
    name: row.name,
  }
}
