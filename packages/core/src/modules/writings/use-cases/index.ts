// Sync use-cases
export type { PushTransactionsDeps } from "./push-transactions"
export { makePushTransactionsUseCase } from "./push-transactions"

export type { PullDocumentDeps } from "./pull-document"
export { makePullDocumentUseCase } from "./pull-document"

export type { ListVersionsDeps } from "./list-versions"
export { makeListVersionsUseCase } from "./list-versions"

export type { GetVersionDeps } from "./get-version"
export { makeGetVersionUseCase } from "./get-version"

// CRUD use-cases
export type { CreateWritingInput, CreateWritingDeps } from "./create-writing"
export { makeCreateWritingUseCase } from "./create-writing"

export type {
  AutosaveWritingInput,
  AutosaveWritingDeps,
} from "./autosave-writing"
export { makeAutosaveWritingUseCase } from "./autosave-writing"

export type { DeleteWritingDeps } from "./delete-writing"
export { makeDeleteWritingUseCase } from "./delete-writing"

export type { GetWritingDeps } from "./get-writing"
export { makeGetWritingUseCase } from "./get-writing"

export type { ListWritingsDeps } from "./list-writings"
export { makeListWritingsUseCase } from "./list-writings"
