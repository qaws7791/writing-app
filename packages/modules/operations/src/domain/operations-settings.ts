import type { OperationsError } from "#operations/domain/operations-error"

type OperationsSettingsValidationError = Extract<
  OperationsError,
  { readonly kind: "validation-failed" }
>

export type OperationsSettingsValidation =
  | Readonly<{ kind: "valid" }>
  | Readonly<{
      error: OperationsSettingsValidationError
      kind: "invalid"
    }>

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
): OperationsSettingsValidation {
  return document.announce.length <= 2_000 && document.banner.length <= 2_000
    ? { kind: "valid" }
    : {
        error: { kind: "validation-failed", reason: "notice-too-long" },
        kind: "invalid",
      }
}

export function validateLegalDocument(
  document: LegalDocument
): OperationsSettingsValidation {
  return document.privacy.length <= 100_000 && document.terms.length <= 100_000
    ? { kind: "valid" }
    : {
        error: {
          kind: "validation-failed",
          reason: "legal-document-too-long",
        },
        kind: "invalid",
      }
}
