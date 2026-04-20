import getHome from "./get-home"

export function homeRoutes() {
  return [getHome] as const
}
