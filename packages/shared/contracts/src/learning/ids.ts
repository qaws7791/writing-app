import type { LearnerId, LessonStepItemId } from "@workspace/types/ids"

import { createIdentifierSchema } from "#contracts/identifier"

export type { LearnerId, LessonStepItemId } from "@workspace/types/ids"

export const learnerIdSchema = createIdentifierSchema<LearnerId>()
export const lessonStepItemIdSchema = createIdentifierSchema<LessonStepItemId>()
