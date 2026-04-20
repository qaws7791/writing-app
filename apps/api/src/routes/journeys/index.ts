import enrollJourney from "./enroll-journey"
import getJourney from "./get-journey"
import listJourneys from "./list-journeys"

export function journeyRoutes() {
  return [listJourneys, getJourney, enrollJourney] as const
}
