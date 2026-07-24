import { z } from "zod"

const loginSearchParamsSchema = z.object({
  authError: z.union([z.string(), z.array(z.string())]).optional(),
  error: z.union([z.string(), z.array(z.string())]).optional(),
  next: z.union([z.string(), z.array(z.string())]).optional(),
  verified: z.union([z.string(), z.array(z.string())]).optional(),
})

export function parseLoginSearchParams(value: unknown): {
  readonly authenticationStatus: "provider-failed" | undefined
  readonly next: readonly string[] | string | undefined
  readonly verificationStatus: "failed" | "verified" | undefined
} {
  const result = loginSearchParamsSchema.safeParse(value)
  if (!result.success) {
    return {
      authenticationStatus: undefined,
      next: undefined,
      verificationStatus: undefined,
    }
  }

  const authenticationStatus =
    readFirst(result.data.authError) === "true"
      ? ("provider-failed" as const)
      : undefined

  return {
    authenticationStatus,
    next: result.data.next,
    verificationStatus:
      authenticationStatus === undefined &&
      readFirst(result.data.error) !== undefined
        ? "failed"
        : readFirst(result.data.verified) === "true"
          ? "verified"
          : undefined,
  }
}

function readFirst(
  value: readonly string[] | string | undefined
): string | undefined {
  return typeof value === "string" ? value : value?.[0]
}
