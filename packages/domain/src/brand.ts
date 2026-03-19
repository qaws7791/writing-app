export type Brand<TValue, TName extends string> = TValue & {
  readonly __brand: TName
}

export type UserId = Brand<string, "user-id">
export type PromptId = Brand<number, "prompt-id">
export type DraftId = Brand<number, "draft-id">

export function toUserId(value: string): UserId {
  return value as UserId
}

export function toPromptId(value: number): PromptId {
  return value as PromptId
}

export function toDraftId(value: number): DraftId {
  return value as DraftId
}
