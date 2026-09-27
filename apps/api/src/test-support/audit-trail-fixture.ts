import type { SqlDatabaseClient as Database } from "@workspace/db/sql-client"

import { createInMemoryWritingAppDatabase } from "@workspace/db/test-support/d1-database"

import { createOperationsModule } from "@workspace/operations/module"
import type {
  AuditEventFailureObserver,
  AuditTrail,
} from "@workspace/operations/ports"

import { runCurrentTestMigration as runApplicationMigrations } from "@workspace/db/test-support/application-migration"

export type AuditTrailFixture = Readonly<{
  auditTrail: AuditTrail
  close: () => Promise<void>
  sqlite: Database
}>

export async function createAuditTrailFixture(input: {
  readonly clock: () => Date
  readonly failureObserver?: AuditEventFailureObserver
  readonly nextId: () => string
}): Promise<AuditTrailFixture> {
  const client = await createInMemoryWritingAppDatabase()
  const close = async () => {
    await client.close()
  }

  try {
    await runApplicationMigrations(client.sqlite)

    return {
      auditTrail: (
        await createOperationsModule({
          audit: {
            failureObserver: input.failureObserver ?? (() => undefined),
            idGenerator: { next: input.nextId },
          },
          clock: { now: input.clock },
          database: client.db,
          reportingDatabase: client.sqlite,
          reportingFailureObserver: () => undefined,
        })
      ).auditTrail,
      close,
      sqlite: client.sqlite,
    }
  } catch (cause) {
    await close()
    throw cause
  }
}
