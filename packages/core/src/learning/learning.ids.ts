import type { Brand } from "../content"

export type UserId = Brand<string, "user-id">
export type LessonProgressStatus = "not-started" | "in-progress" | "completed"

export function userId(value: string): UserId {
  return value as UserId
}
