import type { Failure } from "@workspace/kernel/failure"

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
  | Failure<
      "content-asset-invalid",
      { readonly reason: ContentAssetValidationReason }
    >
  | Failure<"content-asset-persistence-failed">
  | Failure<
      "content-asset-storage-failed",
      {
        readonly compensation: "failed" | "not-required"
        readonly operation: "cleanup-delete" | "compensate-delete" | "upload"
        readonly retryable: boolean
      }
    >
  | Failure<"content-maintenance-invalid">
  | Failure<"content-conflict">
  | Failure<"content-immutable-revision">
  | Failure<"content-idempotency-conflict">
  | Failure<"content-not-found">
  | Failure<
      "content-validation-failed",
      { readonly reason: ContentValidationReason }
    >
