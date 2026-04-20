import type { ProgressRepository } from "@workspace/core/modules/progress"

import type { DbExecutor } from "../types/index"
import { createJourneyProgressMethods } from "./progress.repository-journey-progress"
import { createSessionAiStateMethods } from "./progress.repository-session-ai-state"
import { createSessionProgressMethods } from "./progress.repository-session-progress"

export function createProgressRepository(
  database: DbExecutor
): ProgressRepository {
  return {
    ...createJourneyProgressMethods(database),
    ...createSessionProgressMethods(database),
    ...createSessionAiStateMethods(database),
  }
}
