import { parseEnv, type RawEnv } from "@workspace/env"
import { z } from "zod"

const localAdminApiBaseUrl = "http://localhost:4001"

const adminWebEnvSchema = z.object({
  ADMIN_API_BASE_URL: z.string().url().default(localAdminApiBaseUrl),
})

export type AdminWebEnv = ReturnType<typeof parseAdminWebEnv>

export function parseAdminWebEnv(rawEnv: RawEnv) {
  const env = parseEnv({
    schema: adminWebEnvSchema,
    runtimeEnv: rawEnv,
  })

  return {
    adminApiBaseUrl: env.ADMIN_API_BASE_URL,
  }
}

export function getAdminWebEnv() {
  return parseAdminWebEnv(process.env)
}
