import type { Database } from "bun:sqlite"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { createOperationsModule } from "@workspace/operations/module"
import type {
  AuditEventFailureObserver,
  AuditTrail,
} from "@workspace/operations/ports"

import { runApplicationMigrations } from "@/db/migrate"

export type AuditTrailFixture = Readonly<{
  auditTrail: AuditTrail
  close: () => void
  sqlite: Database
}>

export function createAuditTrailFixture(input: {
  readonly clock: () => Date
  readonly failureObserver?: AuditEventFailureObserver
  readonly nextId: () => string
}): AuditTrailFixture {
  const client = createInMemoryWritingAppDatabase()
  const reportingClient = createInMemoryWritingAppDatabase()
  const close = () => {
    reportingClient.close()
    client.close()
  }

  try {
    runApplicationMigrations(client.sqlite)

    return {
      auditTrail: createOperationsModule({
        audit: {
          failureObserver: input.failureObserver ?? (() => undefined),
          idGenerator: { next: input.nextId },
        },
        clock: { now: input.clock },
        database: client.db,
        reportingDatabase: reportingClient.sqlite,
        reportingFailureObserver: () => undefined,
      }).auditTrail,
      close,
      sqlite: client.sqlite,
    }
  } catch (cause) {
    close()
    throw cause
  }
}
