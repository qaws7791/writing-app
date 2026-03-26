import type { WritingSummary, PromptSummary } from "../../../shared/ports/index"

/**
 * Home page snapshot.
 * Contains curated content for the home screen.
 */
export type HomeSnapshot = {
  readonly recentWritings: readonly WritingSummary[]
  readonly resumeWriting: WritingSummary | null
  readonly savedPrompts: readonly PromptSummary[]
  readonly todayPrompts: readonly PromptSummary[]
}
