export { account, authSchema, session, user, verification } from "./auth.js"
export { drafts } from "./drafts.js"
export { prompts } from "./prompts.js"
export { savedPrompts } from "./saved-prompts.js"

import { account, session, user, verification } from "./auth.js"
import { drafts } from "./drafts.js"
import { prompts } from "./prompts.js"
import { savedPrompts } from "./saved-prompts.js"

export const schema = {
  account,
  drafts,
  prompts,
  savedPrompts,
  session,
  user,
  verification,
} as const
