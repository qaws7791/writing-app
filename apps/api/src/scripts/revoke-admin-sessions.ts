import type { WritingAppDatabase } from "@workspace/db/client"
import { adminAuthSessions } from "@workspace/auth/schema"
import { createLocalDatabase } from "@/scripts/local-bindings"
export async function revokeAllAdminSessions(
  db: WritingAppDatabase
): Promise<number> {
  const result = await db.delete(adminAuthSessions).run()
  return result.meta.changes
}
if (import.meta.main) {
  const client = await createLocalDatabase()
  try {
    process.stdout.write(
      JSON.stringify({
        revokedSessionCount: await revokeAllAdminSessions(client.db),
      }) + "\n"
    )
  } finally {
    await client.close()
  }
}
