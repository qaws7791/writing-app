import { OpenAPIHono } from "@hono/zod-openapi"
import type { Env } from "hono"

import { createDefaultHook } from "./default-hook"

export function createOpenApiApp<TEnv extends Env = Env>(): OpenAPIHono<TEnv> {
  return new OpenAPIHono<TEnv>({
    defaultHook: createDefaultHook<TEnv>(),
  })
}
