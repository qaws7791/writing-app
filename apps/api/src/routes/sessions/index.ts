import completeSession from "./complete-session"
import getSessionDetail from "./get-session"
import retrySessionStepAi from "./retry-step-ai"
import startSession from "./start-session"
import submitStep from "./submit-step"

export function sessionRoutes() {
  return [
    getSessionDetail,
    startSession,
    submitStep,
    retrySessionStepAi,
    completeSession,
  ] as const
}
