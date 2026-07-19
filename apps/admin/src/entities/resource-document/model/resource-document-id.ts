import { z } from "zod"

declare const resourceDocumentIdBrand: unique symbol

export type ResourceDocumentId = string & {
  readonly [resourceDocumentIdBrand]: true
}

export const resourceDocumentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .transform((value) => value as ResourceDocumentId)
