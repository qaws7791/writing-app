/**
 * Prompt module error types.
 */

export type PromptModuleError = { kind: "prompt-not-found"; message: string }

export function promptNotFound(message: string): PromptModuleError {
  return { kind: "prompt-not-found", message }
}
