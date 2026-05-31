import { parseEnv, type RawEnv } from "@workspace/env"
import { z } from "zod"

const localWebApiBaseUrl = "http://localhost:4000"

const webEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default(localWebApiBaseUrl),
  WEB_API_BASE_URL: z.string().url().default(localWebApiBaseUrl),
})

export type WebEnv = ReturnType<typeof parseWebEnv>

export function parseWebEnv(rawEnv: RawEnv) {
  const env = parseEnv({
    schema: webEnvSchema,
    runtimeEnv: rawEnv,
  })

  return {
    browserApiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    serverApiBaseUrl: env.WEB_API_BASE_URL,
  }
}

export function getWebEnv() {
  return parseWebEnv(process.env)
}
