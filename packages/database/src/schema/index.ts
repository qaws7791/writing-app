export { account, authSchema, session, user, verification } from "./auth.js"
export { dailyRecommendations } from "./daily-recommendations.js"
export { writings } from "./writings.js"
export { prompts } from "./prompts.js"
export { savedPrompts } from "./saved-prompts.js"
export { writingTransactions } from "./writing-transactions.js"
export { writingVersions } from "./writing-versions.js"

import { account, session, user, verification } from "./auth.js"
import { dailyRecommendations } from "./daily-recommendations.js"
import { writings } from "./writings.js"
import { prompts } from "./prompts.js"
import { savedPrompts } from "./saved-prompts.js"
import { writingTransactions } from "./writing-transactions.js"
import { writingVersions } from "./writing-versions.js"

export const schema = {
  account,
  dailyRecommendations,
  writings,
  prompts,
  savedPrompts,
  session,
  user,
  verification,
  writingTransactions,
  writingVersions,
} as const
