import type { JourneyId } from "../../shared/brand/index"
import type { PromptSummary } from "../prompts/prompt-types"

export type ActiveJourneySummary = {
  readonly journeyId: JourneyId
  readonly title: string
  readonly description: string
  readonly thumbnailUrl: string | null
  readonly completionRate: number
  readonly currentSessionOrder: number
}

export type HomeSnapshot = {
  readonly dailyPrompt: PromptSummary | null
  readonly activeJourneys: ActiveJourneySummary[]
  readonly completedJourneys: ActiveJourneySummary[]
}
