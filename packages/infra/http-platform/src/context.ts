import type { Env } from "hono"

export type HttpPlatformEnv<TVariables extends object = Record<never, never>> =
  Env & {
    Variables: TVariables & { readonly requestId: string }
  }

export type HttpRequestContext<TDependencies extends object> =
  Readonly<TDependencies>
