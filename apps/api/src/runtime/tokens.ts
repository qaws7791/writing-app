import type { AppVariables } from "../app-env"
import { createToken } from "../lib/injection-token"

// ── Use Cases ──

export const AutosaveWritingUseCase = createToken<
  AppVariables["autosaveWritingUseCase"]
>("autosaveWritingUseCase")
export const BookmarkPromptUseCase = createToken<
  AppVariables["bookmarkPromptUseCase"]
>("bookmarkPromptUseCase")
export const CompareRevisionsUseCase = createToken<
  AppVariables["compareRevisionsUseCase"]
>("compareRevisionsUseCase")
export const CompleteSessionUseCase = createToken<
  AppVariables["completeSessionUseCase"]
>("completeSessionUseCase")
export const CreateWritingUseCase = createToken<
  AppVariables["createWritingUseCase"]
>("createWritingUseCase")
export const DeleteWritingUseCase = createToken<
  AppVariables["deleteWritingUseCase"]
>("deleteWritingUseCase")
export const EnrollJourneyUseCase = createToken<
  AppVariables["enrollJourneyUseCase"]
>("enrollJourneyUseCase")
export const GenerateFeedbackUseCase = createToken<
  AppVariables["generateFeedbackUseCase"]
>("generateFeedbackUseCase")
export const GetHomeUseCase =
  createToken<AppVariables["getHomeUseCase"]>("getHomeUseCase")
export const GetJourneyUseCase =
  createToken<AppVariables["getJourneyUseCase"]>("getJourneyUseCase")
export const GetPromptUseCase =
  createToken<AppVariables["getPromptUseCase"]>("getPromptUseCase")
export const GetSessionDetailUseCase = createToken<
  AppVariables["getSessionDetailUseCase"]
>("getSessionDetailUseCase")
export const GetWritingUseCase =
  createToken<AppVariables["getWritingUseCase"]>("getWritingUseCase")
export const ListJourneysUseCase = createToken<
  AppVariables["listJourneysUseCase"]
>("listJourneysUseCase")
export const ListPromptsUseCase =
  createToken<AppVariables["listPromptsUseCase"]>("listPromptsUseCase")
export const ListWritingsUseCase = createToken<
  AppVariables["listWritingsUseCase"]
>("listWritingsUseCase")
export const StartSessionUseCase = createToken<
  AppVariables["startSessionUseCase"]
>("startSessionUseCase")
export const SubmitStepUseCase =
  createToken<AppVariables["submitStepUseCase"]>("submitStepUseCase")
export const UnbookmarkPromptUseCase = createToken<
  AppVariables["unbookmarkPromptUseCase"]
>("unbookmarkPromptUseCase")

// ── Auth / Infra ──

export const AuthHandler =
  createToken<AppVariables["authHandler"]>("authHandler")
export const AuthSession =
  createToken<AppVariables["authSession"]>("authSession")
export const AuthUser = createToken<AppVariables["authUser"]>("authUser")
export const ReadLatestAuthEmail = createToken<
  AppVariables["readLatestAuthEmail"]
>("readLatestAuthEmail")
export const RequestId = createToken<AppVariables["requestId"]>("requestId")
export const RequestLogger =
  createToken<AppVariables["requestLogger"]>("requestLogger")
export const SqliteVersion =
  createToken<AppVariables["sqliteVersion"]>("sqliteVersion")
export const UserId = createToken<AppVariables["userId"]>("userId")
