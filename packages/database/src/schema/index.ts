export { account, authSchema, session, user, verification } from "./auth"

import { account, session, user, verification } from "./auth"

export const schema = {
  account,
  session,
  user,
  verification,
} as const
