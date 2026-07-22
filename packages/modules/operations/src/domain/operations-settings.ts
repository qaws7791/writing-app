import type { OperationsError } from "#operations/domain/operations-error"

export type NoticeDocument = Readonly<{
  announce: string
  banner: string
}>

export type LegalDocument = Readonly<{
  privacy: string
  terms: string
}>

export type OperationsSettings = Readonly<{
  legal: LegalDocument
  notice: NoticeDocument
}>

export function validateNoticeDocument(
  document: NoticeDocument
): OperationsError | null {
  return document.announce.length <= 2_000 && document.banner.length <= 2_000
    ? null
    : { kind: "validation-failed", reason: "notice-too-long" }
}

export function validateLegalDocument(
  document: LegalDocument
): OperationsError | null {
  return document.privacy.length <= 100_000 && document.terms.length <= 100_000
    ? null
    : { kind: "validation-failed", reason: "legal-document-too-long" }
}
