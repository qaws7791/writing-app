import type { PromptId } from "../../../shared/brand/index"
import {
  createNotFoundError,
  type NotFoundError,
} from "../../../shared/types/index"

export type PromptModuleError = NotFoundError & {
  readonly entity: "prompt"
  readonly id?: PromptId
}

export function promptNotFound(
  message: string,
  promptId?: PromptId
): PromptModuleError {
  return {
    ...createNotFoundError(message, {
      entity: "prompt",
      id: promptId,
    }),
    entity: "prompt",
    id: promptId,
  }
}
