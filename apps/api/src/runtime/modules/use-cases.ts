import type { AwilixContainer } from "awilix"
import type { ApiCradle } from "../container"
import { registerAiUseCases } from "./use-case-registries/ai"
import { registerHomeUseCases } from "./use-case-registries/home"
import { registerJourneyUseCases } from "./use-case-registries/journeys"
import { registerPromptUseCases } from "./use-case-registries/prompts"
import { registerSessionUseCases } from "./use-case-registries/sessions"
import { registerWritingUseCases } from "./use-case-registries/writings"

export {
  AI_USE_CASE_KEYS,
  type CompareRevisionsUseCase,
  type GenerateFeedbackUseCase,
} from "./use-case-registries/ai"
export {
  HOME_USE_CASE_KEYS,
  type GetHomeUseCase,
  type HealthCheckUseCase,
} from "./use-case-registries/home"
export {
  JOURNEY_USE_CASE_KEYS,
  type EnrollJourneyUseCase,
  type GetJourneyUseCase,
  type ListCompletedJourneysUseCase,
  type ListJourneysUseCase,
  type ListUserJourneysUseCase,
} from "./use-case-registries/journeys"
export {
  PROMPT_USE_CASE_KEYS,
  type BookmarkPromptUseCase,
  type GetPromptUseCase,
  type ListPromptWritingsUseCase,
  type ListPromptsUseCase,
  type UnbookmarkPromptUseCase,
} from "./use-case-registries/prompts"
export {
  SESSION_USE_CASE_KEYS,
  type CompleteSessionUseCase,
  type GetSessionDetailUseCase,
  type RetrySessionStepAiUseCase,
  type StartSessionUseCase,
  type SubmitStepUseCase,
} from "./use-case-registries/sessions"
export {
  WRITING_USE_CASE_KEYS,
  type AutosaveWritingUseCase,
  type CreateWritingUseCase,
  type DeleteWritingUseCase,
  type GetWritingUseCase,
  type ListWritingsUseCase,
} from "./use-case-registries/writings"

export function registerUseCases(container: AwilixContainer<ApiCradle>) {
  registerWritingUseCases(container)
  registerPromptUseCases(container)
  registerHomeUseCases(container)
  registerJourneyUseCases(container)
  registerSessionUseCases(container)
  registerAiUseCases(container)
}
