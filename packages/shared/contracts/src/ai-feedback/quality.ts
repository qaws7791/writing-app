import { z } from "zod"

export const aiFeedbackQualityFailureCodeSchema = z.enum([
  "pending-expired",
  "persistence-failed",
  "provider-response-invalid",
  "provider-timeout",
  "provider-unavailable",
  "request-aborted",
])

const nonNegativeIntegerSchema = z.number().int().nonnegative()

export const aiFeedbackQualityQuerySchema = z
  .strictObject({
    from: z.iso.datetime(),
    to: z.iso.datetime(),
  })
  .superRefine(({ from, to }, context) => {
    const fromTime = new Date(from).getTime()
    const toTime = new Date(to).getTime()
    if (fromTime >= toTime) {
      context.addIssue({
        code: "custom",
        message: "from은 to보다 이전이어야 합니다.",
        path: ["to"],
      })
      return
    }
    if (toTime - fromTime > 365 * 24 * 60 * 60 * 1_000) {
      context.addIssue({
        code: "custom",
        message: "AI 품질 조회 기간은 365일 이하여야 합니다.",
        path: ["to"],
      })
    }
  })

export const aiFeedbackQualitySnapshotSchema = z.strictObject({
  failureCount: nonNegativeIntegerSchema,
  failureCounts: z.array(
    z.strictObject({
      code: aiFeedbackQualityFailureCodeSchema,
      count: nonNegativeIntegerSchema,
    })
  ),
  from: z.iso.datetime(),
  latency: z.strictObject({
    averageMs: z.number().nonnegative().nullable(),
    sampleCount: nonNegativeIntegerSchema,
    totalMs: nonNegativeIntegerSchema,
  }),
  requestCount: nonNegativeIntegerSchema,
  retryCount: nonNegativeIntegerSchema,
  status: z.enum(["available", "empty"]),
  successCount: nonNegativeIntegerSchema,
  successRate: z.number().min(0).max(1).nullable(),
  to: z.iso.datetime(),
  tokens: z.strictObject({
    input: nonNegativeIntegerSchema,
    output: nonNegativeIntegerSchema,
    sampleCount: nonNegativeIntegerSchema,
  }),
})

export type AiFeedbackQualityQuery = z.infer<
  typeof aiFeedbackQualityQuerySchema
>
export type AiFeedbackQualitySnapshot = z.infer<
  typeof aiFeedbackQualitySnapshotSchema
>
