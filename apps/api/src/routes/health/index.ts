import getHealth from "./get-health"

export function healthRoutes() {
  return [getHealth] as const
}
