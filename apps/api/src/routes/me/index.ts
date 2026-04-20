import getMe from "./get-me"

export function meRoutes() {
  return [getMe] as const
}
