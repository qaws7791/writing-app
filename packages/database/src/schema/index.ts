export { account, authSchema, session, user, verification } from "./auth.js"
export { dailyRecommendations } from "./daily-recommendations.js"
export { drafts } from "./drafts.js"
export { prompts } from "./prompts.js"
export { savedPrompts } from "./saved-prompts.js"

import { account, session, user, verification } from "./auth.js"
import { dailyRecommendations } from "./daily-recommendations.js"
import { drafts } from "./drafts.js"
import { prompts } from "./prompts.js"
import { savedPrompts } from "./saved-prompts.js"

export const schema = {
  account,
  dailyRecommendations,
  drafts,
  prompts,
  savedPrompts,
  session,
  user,
  verification,
} as const
