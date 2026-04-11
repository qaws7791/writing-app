import type { JourneyId } from "../../shared/brand/index"

export type ActiveJourneySummary = {
  readonly journeyId: JourneyId
  readonly title: string
  readonly description: string
  readonly thumbnailUrl: string | null
  readonly completionRate: number
  readonly currentSessionOrder: number
}

export type HomeSnapshot = {
  readonly activeJourneys: ActiveJourneySummary[]
  readonly showStartJourneyCta: boolean
  readonly showWritingSuggestion: boolean
}
