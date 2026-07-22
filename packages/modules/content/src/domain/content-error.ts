type ContentValidationReason =
  | "duplicate-id"
  | "empty-lesson"
  | "empty-step-content"
  | "empty-unit"
  | "invalid-ai-feedback-target"
  | "invalid-course-reference"
  | "invalid-lesson-reference"
  | "invalid-selectable-item-reference"
  | "invalid-sort-order"
  | "invalid-step-content"
  | "invalid-step-type"
  | "invalid-unit-reference"

export type ContentError =
  | { readonly kind: "content-conflict" }
  | { readonly kind: "content-forbidden" }
  | { readonly kind: "content-immutable-revision" }
  | { readonly kind: "content-not-found" }
  | { readonly kind: "content-reset-forbidden" }
  | {
      readonly kind: "content-validation-failed"
      readonly reason: ContentValidationReason
    }
