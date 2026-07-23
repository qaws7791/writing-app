import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { assertPublicUrlTransport } from "@workspace/env/public-url"
import { z } from "zod/mini"

const optionalUrlSchema = z.optional(z.union([z.url(), z.literal("")]))
const adminRuntimeEnvSchema = z.looseObject({
  NEXT_PUBLIC_LEARNER_WEB_ORIGIN: optionalUrlSchema,
  NODE_ENV: z.optional(z.string()),
})

type AdminRuntimeEnv = z.input<typeof adminRuntimeEnvSchema>

export function readLearnerWebOrigin(env?: AdminRuntimeEnv): string {
  const runtimeEnv = adminRuntimeEnvSchema.parse(env ?? process.env)
  const candidate = runtimeEnv.NEXT_PUBLIC_LEARNER_WEB_ORIGIN
  const nodeEnvironment = runtimeEnv.NODE_ENV

  if (
    nodeEnvironment === "production" &&
    (candidate === undefined || candidate.trim() === "")
  ) {
    throw new Error("production learner web origin is required")
  }

  const url = new URL(
    candidate === undefined || candidate.trim() === ""
      ? localRuntimeDefaults.learnerWebOrigin
      : candidate
  )
  assertPublicUrlTransport(url, {
    description: "learner web origin",
    nodeEnvironment,
  })

  return url.origin
}
