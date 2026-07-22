import { Agent } from "@mastra/core/agent"
import { Mastra } from "@mastra/core"
import { RequestContext } from "@mastra/core/request-context"
import { createTool } from "@mastra/core/tools"
import { err, type Result } from "@workspace/kernel/result"
import { z } from "zod"

import { createManagedAiRuntime, type ManagedAiRuntime } from "#ai/lifecycle"
import type { AiInfrastructureError } from "#ai/openai-client"

const mastraRuntimeConfigSchema = z.object({
  apiKey: z.string().min(1),
  timeoutMs: z.number().int().positive(),
})

export const createMastraTool = createTool
export { RequestContext as MastraRequestContext }

export function createMastraAgent(
  input: ConstructorParameters<typeof Agent>[0]
) {
  return new Agent(input)
}

export type ManagedMastraRuntime = ManagedAiRuntime<Mastra>

export function createMastraRuntime(input: {
  readonly agents: NonNullable<
    ConstructorParameters<typeof Mastra>[0]
  >["agents"]
  readonly apiKey?: string
  readonly signal?: AbortSignal
  readonly timeoutMs: number
}): Result<ManagedMastraRuntime, AiInfrastructureError> {
  const parsed = mastraRuntimeConfigSchema.safeParse(input)
  if (!parsed.success || input.signal?.aborted === true) {
    return err({
      cause: parsed.success ? input.signal?.reason : parsed.error,
      kind: "configuration-invalid",
      operation: "configure",
      retryable: false,
    })
  }

  return createManagedAiRuntime((registerCleanup) => {
    const mastra = new Mastra({ agents: input.agents })
    registerCleanup(() => mastra.shutdown())
    return mastra
  }).mapErr((error) => ({
    cause: error.cause,
    kind: "operation-failed" as const,
    operation: "configure" as const,
    retryable: false,
  }))
}
