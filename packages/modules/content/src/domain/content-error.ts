import type { ContentAssetValidationReason } from "#content/domain/content-asset"

type ContentValidationReason =
  | "duplicate-id"
  | "empty-lesson"
  | "empty-step-content"
  | "empty-unit"
  | "invalid-ai-feedback-target"
  | "invalid-asset-reference"
  | "invalid-course-reference"
  | "invalid-lesson-reference"
  | "invalid-selectable-item-reference"
  | "invalid-sort-order"
  | "invalid-step-content"
  | "invalid-step-type"
  | "invalid-unit-reference"

export type ContentError =
  | {
      readonly kind: "content-asset-invalid"
      readonly reason: ContentAssetValidationReason
    }
  | {
      readonly kind: "content-asset-persistence-failed"
    }
  | {
      readonly compensation: "failed" | "not-required"
      readonly kind: "content-asset-storage-failed"
      readonly operation: "cleanup-delete" | "compensate-delete" | "upload"
      readonly retryable: boolean
    }
  | { readonly kind: "content-maintenance-invalid" }
  | { readonly kind: "content-conflict" }
  | { readonly kind: "content-immutable-revision" }
  | { readonly kind: "content-not-found" }
  | {
      readonly kind: "content-validation-failed"
      readonly reason: ContentValidationReason
    }
