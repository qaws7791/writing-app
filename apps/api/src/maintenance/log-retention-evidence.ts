import { z } from "zod"

const placeholderEvidencePattern =
  /(?:^|[-_./:])(example|none|null|placeholder|tbd|todo|unknown)(?:[-_./:]|$)/iu

const evidenceReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine((value) => !placeholderEvidencePattern.test(value), {
    message: "실제 외부 증거 식별자를 사용해야 합니다.",
  })

const externalLogRetentionEvidenceSchema = z
  .object({
    applicationRequestRetentionDays: z.number().int().positive().max(30),
    evidenceId: evidenceReferenceSchema,
    securityRetentionDays: z.number().int().positive().max(90),
    sink: evidenceReferenceSchema,
    validUntil: z.iso.datetime(),
    verifiedAt: z.iso.datetime(),
  })
  .strict()

export type ExternalLogRetentionEvidence = Readonly<{
  applicationRequestRetentionDays: number
  evidenceId: string
  securityRetentionDays: number
  sink: string
  validUntil: Date
  verifiedAt: Date
}>

export function parseExternalLogRetentionEvidence(
  value: unknown,
  now: Date
): ExternalLogRetentionEvidence {
  const parsed = externalLogRetentionEvidenceSchema.parse(value)
  const verifiedAt = new Date(parsed.verifiedAt)
  const validUntil = new Date(parsed.validUntil)
  if (
    !Number.isFinite(now.getTime()) ||
    verifiedAt > now ||
    validUntil <= now ||
    validUntil <= verifiedAt
  ) {
    throw new Error(
      "외부 log retention 검증 증거의 유효기간이 올바르지 않습니다."
    )
  }

  return {
    applicationRequestRetentionDays: parsed.applicationRequestRetentionDays,
    evidenceId: parsed.evidenceId,
    securityRetentionDays: parsed.securityRetentionDays,
    sink: parsed.sink,
    validUntil,
    verifiedAt,
  }
}
