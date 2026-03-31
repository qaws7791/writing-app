import type { AppVariables } from "../app-env"
import { createToken } from "../lib/injection-token"

// ── Use Cases ──

export const AiUseCases = createToken<AppVariables["aiUseCases"]>("aiUseCases")
export const AutosaveWritingUseCase = createToken<
  AppVariables["autosaveWritingUseCase"]
>("autosaveWritingUseCase")
export const CreateWritingUseCase = createToken<
  AppVariables["createWritingUseCase"]
>("createWritingUseCase")
export const DeleteWritingUseCase = createToken<
  AppVariables["deleteWritingUseCase"]
>("deleteWritingUseCase")
export const GetHomeUseCase =
  createToken<AppVariables["getHomeUseCase"]>("getHomeUseCase")
export const GetPromptUseCase =
  createToken<AppVariables["getPromptUseCase"]>("getPromptUseCase")
export const GetVersionUseCase =
  createToken<AppVariables["getVersionUseCase"]>("getVersionUseCase")
export const GetWritingUseCase =
  createToken<AppVariables["getWritingUseCase"]>("getWritingUseCase")
export const ListPromptsUseCase =
  createToken<AppVariables["listPromptsUseCase"]>("listPromptsUseCase")
export const ListVersionsUseCase = createToken<
  AppVariables["listVersionsUseCase"]
>("listVersionsUseCase")
export const ListWritingsUseCase = createToken<
  AppVariables["listWritingsUseCase"]
>("listWritingsUseCase")
export const PullDocumentUseCase = createToken<
  AppVariables["pullDocumentUseCase"]
>("pullDocumentUseCase")
export const PushTransactionsUseCase = createToken<
  AppVariables["pushTransactionsUseCase"]
>("pushTransactionsUseCase")
export const SavePromptUseCase =
  createToken<AppVariables["savePromptUseCase"]>("savePromptUseCase")
export const UnsavePromptUseCase = createToken<
  AppVariables["unsavePromptUseCase"]
>("unsavePromptUseCase")

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
