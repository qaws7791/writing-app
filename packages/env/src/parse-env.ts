import { z } from "zod"

export type RawEnv = Record<string, string | undefined>

type EnvSchema = z.ZodObject<z.ZodRawShape>

type StrictRuntimeEnv<TSchema extends EnvSchema> = {
  [TKey in keyof z.infer<TSchema> & string]-?: string | undefined
}

type ParseEnvOptions<TSchema extends EnvSchema> = {
  schema: TSchema
  emptyStringAsUndefined?: boolean
  onValidationError?: (error: EnvParseError) => never
} & (
  | {
      runtimeEnv: RawEnv
      runtimeEnvStrict?: never
    }
  | {
      runtimeEnv?: never
      runtimeEnvStrict: StrictRuntimeEnv<TSchema>
    }
)

export class EnvParseError extends Error {
  readonly issues: z.ZodIssue[]

  constructor(message: string, issues: readonly z.ZodIssue[]) {
    super(message)
    this.name = "EnvParseError"
    this.issues = [...issues]
  }
}

export function formatEnvIssues(issues: readonly z.ZodIssue[]) {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "env"

      return `- ${path}: ${issue.message}`
    })
    .sort()
    .join("\n")
}

export function parseEnv<TSchema extends EnvSchema>(
  options: ParseEnvOptions<TSchema>
): Readonly<z.infer<TSchema>> {
  const { schema, emptyStringAsUndefined = true, onValidationError } = options
  const runtimeEnv = options.runtimeEnv ?? options.runtimeEnvStrict

  if (runtimeEnv === undefined) {
    throw new Error("runtimeEnv or runtimeEnvStrict is required")
  }

  const parseTarget = emptyStringAsUndefined
    ? normalizeEmptyStrings(runtimeEnv)
    : runtimeEnv

  const result = schema.safeParse(parseTarget)

  if (!result.success) {
    const message = `Invalid environment variables:\n${formatEnvIssues(
      result.error.issues
    )}`
    const error = new EnvParseError(message, result.error.issues)

    if (onValidationError) {
      return onValidationError(error)
    }

    throw error
  }

  return Object.freeze(result.data) as Readonly<z.infer<TSchema>>
}

function normalizeEmptyStrings(runtimeEnv: RawEnv): RawEnv {
  return Object.fromEntries(
    Object.entries(runtimeEnv).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ])
  )
}
