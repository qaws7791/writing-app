import {
  createJourneyRepository,
  createWritingPromptRepository,
} from "@workspace/database"

import { getDb } from "./db"

export function getRepositories() {
  const db = getDb()
  return {
    journeyRepository: createJourneyRepository(db),
    promptRepository: createWritingPromptRepository(db),
  }
}
