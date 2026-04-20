import getAuthEmails from "./get-auth-emails"

export function devRoutes() {
  return [getAuthEmails] as const
}
