import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"

export const EnrollJourneyUseCase = createToken<
  AppVariables["enrollJourneyUseCase"]
>("enrollJourneyUseCase")
export const GetJourneyUseCase =
  createToken<AppVariables["getJourneyUseCase"]>("getJourneyUseCase")
export const GetSessionDetailUseCase = createToken<
  AppVariables["getSessionDetailUseCase"]
>("getSessionDetailUseCase")
export const ListCompletedJourneysUseCase = createToken<
  AppVariables["listCompletedJourneysUseCase"]
>("listCompletedJourneysUseCase")
export const ListJourneysUseCase = createToken<
  AppVariables["listJourneysUseCase"]
>("listJourneysUseCase")
export const ListUserJourneysUseCase = createToken<
  AppVariables["listUserJourneysUseCase"]
>("listUserJourneysUseCase")
export const CompleteSessionUseCase = createToken<
  AppVariables["completeSessionUseCase"]
>("completeSessionUseCase")
export const RetrySessionStepAiUseCase = createToken<
  AppVariables["retrySessionStepAiUseCase"]
>("retrySessionStepAiUseCase")
export const StartSessionUseCase = createToken<
  AppVariables["startSessionUseCase"]
>("startSessionUseCase")
export const SubmitStepUseCase =
  createToken<AppVariables["submitStepUseCase"]>("submitStepUseCase")
