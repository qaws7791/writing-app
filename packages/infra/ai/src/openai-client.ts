import OpenAI from "openai"
import { err, ok, type Result } from "@workspace/kernel/result"
import { z } from "zod"

const openAiClientConfigSchema = z.object({
  apiKey: z.string().min(1),
  timeoutMs: z.number().int().positive(),
})

export type AiInfrastructureError = Readonly<{
  cause?: unknown
  kind:
    | "configuration-invalid"
    | "operation-aborted"
    | "operation-failed"
    | "operation-timed-out"
  operation: "configure" | "provider-request"
  retryable: boolean
  timeoutMs?: number
}>

export type OpenAiClientRuntime = {
  readonly client: OpenAI
  readonly signal?: AbortSignal
  readonly timeoutMs: number
}

export function createOpenAiClient(input: {
  readonly apiKey?: string
  readonly signal?: AbortSignal
  readonly timeoutMs: number
}): Result<OpenAiClientRuntime, AiInfrastructureError> {
  const parsed = openAiClientConfigSchema.safeParse(input)
  if (!parsed.success || input.signal?.aborted === true) {
    return err({
      cause: parsed.success ? input.signal?.reason : parsed.error,
      kind: "configuration-invalid",
      operation: "configure",
      retryable: false,
    })
  }

  return ok({
    client: new OpenAI({
      apiKey: parsed.data.apiKey,
      timeout: parsed.data.timeoutMs,
    }),
    ...(input.signal === undefined ? {} : { signal: input.signal }),
    timeoutMs: parsed.data.timeoutMs,
  })
}

export function normalizeAiProviderError(
  cause: unknown,
  timeoutMs: number
): AiInfrastructureError {
  if (readErrorName(cause) === "AbortError") {
    return {
      cause,
      kind: "operation-aborted",
      operation: "provider-request",
      retryable: false,
    }
  }
  if (readErrorCode(cause) === "ETIMEDOUT") {
    return {
      cause,
      kind: "operation-timed-out",
      operation: "provider-request",
      retryable: true,
      timeoutMs,
    }
  }
  return {
    cause,
    kind: "operation-failed",
    operation: "provider-request",
    retryable: true,
  }
}

function readErrorName(error: unknown): unknown {
  return typeof error === "object" && error !== null && "name" in error
    ? error.name
    : undefined
}

function readErrorCode(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined
}
