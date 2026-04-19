import {
  makeListJourneysUseCase,
  makeGetJourneyFullUseCase,
  makeGetSessionDetailUseCase,
  makeListSessionsUseCase,
  makeCreateJourneyUseCase,
  makeUpdateJourneyUseCase,
  makeDeleteJourneyUseCase,
  makeCreateSessionUseCase,
  makeUpdateSessionUseCase,
  makeDeleteSessionUseCase,
  makeCreateStepUseCase,
  makeUpdateStepUseCase,
  makeDeleteStepUseCase,
  makeListPromptsUseCase,
  makeGetPromptUseCase,
  makeCreatePromptUseCase,
  makeUpdatePromptUseCase,
  makeDeletePromptUseCase,
} from "@workspace/core"

import { getRepositories } from "./repositories"

export function getUseCases() {
  const { journeyRepository, promptRepository } = getRepositories()
  return {
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
  }
}
