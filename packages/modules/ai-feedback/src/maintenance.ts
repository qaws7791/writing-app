import type { WritingAppDatabase } from "@workspace/db/client"
import type { Clock } from "@workspace/kernel/clock"

import {
  createAiFeedbackMaintenance,
  type AiFeedbackMaintenance,
} from "#ai-feedback/application/ai-feedback-maintenance"
import { createDrizzleAiFeedbackMaintenanceRepository } from "#ai-feedback/infrastructure/persistence/ai-feedback-maintenance-drizzle-repository"

export type {
  AiFeedbackMaintenance,
  AiFeedbackMaintenanceError,
  ExpireStaleAiFeedbackResult,
} from "#ai-feedback/application/ai-feedback-maintenance"

export function createAiFeedbackMaintenanceForDatabase(input: {
  readonly clock: Clock
  readonly database: WritingAppDatabase
}): AiFeedbackMaintenance {
  return createAiFeedbackMaintenance({
    clock: input.clock,
    repository: createDrizzleAiFeedbackMaintenanceRepository(input.database),
  })
}
