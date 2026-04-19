import type { JourneyRepository } from "../../modules/journeys/journey-port"
import type { ProgressRepository } from "../../modules/progress/progress-port"
import type { PromptRepository } from "../../modules/prompts/prompt-port"
import type { WritingRepository } from "../../modules/writings/writing-port"

export type RepositoryTransactionScope = {
  readonly journeyRepository: JourneyRepository
  readonly progressRepository: ProgressRepository
  readonly promptRepository: PromptRepository
  readonly writingRepository: WritingRepository
}

export interface RepositoryTransactionManager {
  run<T>(work: (scope: RepositoryTransactionScope) => Promise<T>): Promise<T>
}
