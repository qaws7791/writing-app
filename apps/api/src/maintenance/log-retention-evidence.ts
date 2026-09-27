export type ExternalLogRetentionEvidence = Readonly<{
  applicationRequestRetentionDays: number
  evidenceId: string
  securityRetentionDays: number
  sink: string
  validUntil: Date
  verifiedAt: Date
}>
