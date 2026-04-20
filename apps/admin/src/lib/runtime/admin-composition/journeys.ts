import {
  makeCreateJourneyUseCase,
  makeCreateSessionUseCase,
  makeCreateStepUseCase,
  makeDeleteJourneyUseCase,
  makeDeleteSessionUseCase,
  makeDeleteStepUseCase,
  makeGetJourneyFullUseCase,
  makeGetSessionDetailUseCase,
  makeListJourneysUseCase,
  makeListSessionsUseCase,
  makeUpdateJourneyUseCase,
  makeUpdateSessionUseCase,
  makeUpdateStepUseCase,
} from "@workspace/core/modules/journeys"
import type { createJourneyRepository } from "@workspace/database"

type JourneyRepository = ReturnType<typeof createJourneyRepository>

export type JourneyAdminUseCases = {
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
}

export function createJourneyAdminUseCases({
  journeyRepository,
}: {
  journeyRepository: JourneyRepository
}): JourneyAdminUseCases {
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
  }
}
