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
