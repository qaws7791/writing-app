import type { AppEnv } from "../app-env"
import { defineRoute } from "../lib/hono/define-route"

export const route = defineRoute<AppEnv>()
