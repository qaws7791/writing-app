import authHandler from "./auth/auth-handler"
import getHealth from "./health/get-health"
import getHome from "./home/get-home"
import getMe from "./me/get-me"
import getUserProfile from "./users/get-user-profile"

export function allRoutes() {
  return [getHealth, authHandler, getMe, getHome, getUserProfile] as const
}
