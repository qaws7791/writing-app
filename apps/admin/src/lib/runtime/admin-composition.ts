import {
  makeCreateJourneyUseCase,
  makeCreatePromptUseCase,
  makeCreateSessionUseCase,
  makeCreateStepUseCase,
  makeDeleteJourneyUseCase,
  makeDeletePromptUseCase,
  makeDeleteSessionUseCase,
  makeDeleteStepUseCase,
  makeGetJourneyFullUseCase,
  makeGetPromptUseCase,
  makeGetSessionDetailUseCase,
  makeListJourneysUseCase,
  makeListPromptsUseCase,
  makeListSessionsUseCase,
  makeUpdateJourneyUseCase,
  makeUpdatePromptUseCase,
  makeUpdateSessionUseCase,
  makeUpdateStepUseCase,
} from "@workspace/core"
import {
  createJourneyRepository,
  createRepositoryTransactionManager,
  createWritingPromptRepository,
  openDb,
} from "@workspace/database"

import { env } from "@/env"

export type AdminUseCases = {
  readonly listJourneys: ReturnType<typeof makeListJourneysUseCase>
  readonly getJourneyFull: ReturnType<typeof makeGetJourneyFullUseCase>
  readonly getSessionDetail: ReturnType<typeof makeGetSessionDetailUseCase>
  readonly listSessions: ReturnType<typeof makeListSessionsUseCase>
  readonly createJourney: ReturnType<typeof makeCreateJourneyUseCase>
  readonly updateJourney: ReturnType<typeof makeUpdateJourneyUseCase>
  readonly deleteJourney: ReturnType<typeof makeDeleteJourneyUseCase>
  readonly createSession: ReturnType<typeof makeCreateSessionUseCase>
  readonly updateSession: ReturnType<typeof makeUpdateSessionUseCase>
  readonly deleteSession: ReturnType<typeof makeDeleteSessionUseCase>
  readonly createStep: ReturnType<typeof makeCreateStepUseCase>
  readonly updateStep: ReturnType<typeof makeUpdateStepUseCase>
  readonly deleteStep: ReturnType<typeof makeDeleteStepUseCase>
  readonly listPrompts: ReturnType<typeof makeListPromptsUseCase>
  readonly getPrompt: ReturnType<typeof makeGetPromptUseCase>
  readonly createPrompt: ReturnType<typeof makeCreatePromptUseCase>
  readonly updatePrompt: ReturnType<typeof makeUpdatePromptUseCase>
  readonly deletePrompt: ReturnType<typeof makeDeletePromptUseCase>
}

export type AdminRuntime = {
  readonly database: ReturnType<typeof openDb>
  readonly transactionManager: ReturnType<
    typeof createRepositoryTransactionManager
  >
  readonly useCases: AdminUseCases
}

let runtimeInstance: AdminRuntime | null = null

export function getAdminRuntime(): AdminRuntime {
  if (runtimeInstance) {
    return runtimeInstance
  }

  const database = openDb(env.DATABASE_URL)
  const promptRepository = createWritingPromptRepository(database.db)
  const journeyRepository = createJourneyRepository(database.db)
  const transactionManager = createRepositoryTransactionManager(database.db)

  runtimeInstance = {
    database,
    transactionManager,
    useCases: {
      listJourneys: makeListJourneysUseCase({ journeyRepository }),
      getJourneyFull: makeGetJourneyFullUseCase({ journeyRepository }),
      getSessionDetail: makeGetSessionDetailUseCase({ journeyRepository }),
      listSessions: makeListSessionsUseCase({ journeyRepository }),
      createJourney: makeCreateJourneyUseCase({ journeyRepository }),
      updateJourney: makeUpdateJourneyUseCase({ journeyRepository }),
      deleteJourney: makeDeleteJourneyUseCase({ journeyRepository }),
      createSession: makeCreateSessionUseCase({ journeyRepository }),
      updateSession: makeUpdateSessionUseCase({ journeyRepository }),
      deleteSession: makeDeleteSessionUseCase({ journeyRepository }),
      createStep: makeCreateStepUseCase({ journeyRepository }),
      updateStep: makeUpdateStepUseCase({ journeyRepository }),
      deleteStep: makeDeleteStepUseCase({ journeyRepository }),
      listPrompts: makeListPromptsUseCase({ promptRepository }),
      getPrompt: makeGetPromptUseCase({ promptRepository }),
      createPrompt: makeCreatePromptUseCase({ promptRepository }),
      updatePrompt: makeUpdatePromptUseCase({ promptRepository }),
      deletePrompt: makeDeletePromptUseCase({ promptRepository }),
    },
  }

  return runtimeInstance
}
