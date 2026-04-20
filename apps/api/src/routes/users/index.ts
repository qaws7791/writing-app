import getUserProfile from "./get-user-profile"

export function userRoutes() {
  return [getUserProfile] as const
}
