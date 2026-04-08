export { account, authSchema, session, user, verification } from "./auth"
export { journeys, journeyCategories } from "./journeys"
export { journeySessions } from "./journey-sessions"
export { savedPrompts } from "./saved-prompts"
export { steps, stepTypes } from "./steps"
export {
  userJourneyProgress,
  journeyProgressStatuses,
} from "./user-journey-progress"
export {
  userSessionProgress,
  sessionProgressStatuses,
} from "./user-session-progress"
export {
  userSessionStepAiState,
  sessionStepAiStateKinds,
  sessionStepAiStateStatuses,
} from "./user-session-step-ai-state"
export { writings, writingStatuses } from "./writings"
export { writingPrompts, promptTypes } from "./writing-prompts"
export { writingVersions } from "./writing-versions"

import { account, session, user, verification } from "./auth"
import { journeys } from "./journeys"
import { journeySessions } from "./journey-sessions"
import { savedPrompts } from "./saved-prompts"
import { steps } from "./steps"
import { userJourneyProgress } from "./user-journey-progress"
import { userSessionProgress } from "./user-session-progress"
import { userSessionStepAiState } from "./user-session-step-ai-state"
import { writings } from "./writings"
import { writingPrompts } from "./writing-prompts"
import { writingVersions } from "./writing-versions"

export const schema = {
  account,
  journeys,
  journeySessions,
  savedPrompts,
  session,
  steps,
  user,
  userJourneyProgress,
  userSessionProgress,
  userSessionStepAiState,
  verification,
  writings,
  writingPrompts,
  writingVersions,
} as const
