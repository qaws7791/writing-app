import type { JourneyAdminUseCases } from "./admin-composition/journeys"
import { createJourneyAdminUseCases } from "./admin-composition/journeys"
import type { PromptAdminUseCases } from "./admin-composition/prompts"
import { createPromptAdminUseCases } from "./admin-composition/prompts"
import { createAdminInfrastructure } from "./admin-composition/runtime"

export type AdminUseCases = JourneyAdminUseCases & PromptAdminUseCases

export type AdminRuntime = {
  readonly database: ReturnType<typeof createAdminInfrastructure>["database"]
  readonly transactionManager: ReturnType<
    typeof createAdminInfrastructure
  >["transactionManager"]
  readonly useCases: AdminUseCases
}

let runtimeInstance: AdminRuntime | null = null

export function getAdminRuntime(): AdminRuntime {
  if (runtimeInstance) {
    return runtimeInstance
  }

  const infrastructure = createAdminInfrastructure()

  runtimeInstance = {
    database: infrastructure.database,
    transactionManager: infrastructure.transactionManager,
    useCases: {
      ...createJourneyAdminUseCases({
        journeyRepository: infrastructure.journeyRepository,
      }),
      ...createPromptAdminUseCases({
        promptRepository: infrastructure.promptRepository,
      }),
    },
  }

  return runtimeInstance
}
