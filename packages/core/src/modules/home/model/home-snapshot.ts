import type { WritingSummary } from "../../writings/writing-types"
import type { PromptSummary } from "../../prompts/prompt-types"

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
