import { z } from "zod"

export type RawEnv = Record<string, string | undefined>

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

export function parseEnv() {
  throw new Error("parseEnv is not implemented yet")
}
