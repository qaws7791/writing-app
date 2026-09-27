import { createLocalBindings } from "@/scripts/local-bindings"
import { createWorkerRuntime } from "@/worker"
import { createDailyMaintenance } from "@/maintenance/daily-maintenance"
import { createExpiredSessionMaintenance } from "@/maintenance/expired-session-maintenance"

if (import.meta.main) {
  const proxy = await createLocalBindings()
  try {
    const { container, database } = await createWorkerRuntime(proxy.env)
    const maintenance = createDailyMaintenance({
      auditTrail: container.modules.operations.auditTrail,
      clock: container.platform.clock,
      contentAssets: container.modules.content.maintenance,
      deletedLearners: container.modules.identity.deletedLearnerPurge,
      expiredSessions: createExpiredSessionMaintenance(database.db),
      externalLogRetentionEvidence: null,
    })
    const result = await maintenance.execute({
      batchSize: 100,
      dryRun: process.argv.includes("--dry-run"),
    })
    if (result.isErr())
      throw new Error("일일 정리 실패", { cause: result.error })
    process.stdout.write(JSON.stringify(result.value) + "\n")
  } finally {
    await proxy.dispose()
  }
}
