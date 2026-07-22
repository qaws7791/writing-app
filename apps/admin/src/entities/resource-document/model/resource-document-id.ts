import { z } from "zod"
import type { ResourceDocumentId } from "@workspace/types/ids"

export type { ResourceDocumentId } from "@workspace/types/ids"

export const resourceDocumentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .transform((value) => value as ResourceDocumentId)
