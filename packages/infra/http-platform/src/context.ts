import type { Env } from "hono"

export type HttpRequestActor = Readonly<{
  id: string
  role?: string
  type: "admin" | "learner"
}>

export type HttpPlatformEnv<TVariables extends object = Record<never, never>> =
  Env & {
    Variables: TVariables & {
      readonly requestActor?: HttpRequestActor
      readonly requestId: string
    }
  }

export type HttpRequestContext<TDependencies extends object> =
  Readonly<TDependencies>
