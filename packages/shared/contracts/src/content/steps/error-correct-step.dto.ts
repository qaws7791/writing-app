import { z } from "zod"

import {
  lessonStepBaseSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const errorCorrectStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("ERROR_CORRECT"),
    question: z.string(),
    segments: z.array(z.string()).min(2),
    segmentIds: z.array(stableStepItemIdSchema).min(2),
    correctSegment: stableStepItemIdSchema,
    fixes: z.array(z.string()).min(2),
    fixIds: z.array(stableStepItemIdSchema).min(2),
    correctFix: stableStepItemIdSchema,
    explanation: z.string(),
  })
  .superRefine((step, context) => {
    if (step.segmentIds.length !== step.segments.length) {
      context.addIssue({
        code: "custom",
        message: "구간과 구간 ID 개수는 같아야 합니다.",
        path: ["segmentIds"],
      })
    }
    if (new Set(step.segmentIds).size !== step.segmentIds.length) {
      context.addIssue({
        code: "custom",
        message: "구간 ID는 중복될 수 없습니다.",
        path: ["segmentIds"],
      })
    }
    if (!step.segmentIds.includes(step.correctSegment)) {
      context.addIssue({
        code: "custom",
        message: "오류 구간 정답은 구간 ID를 참조해야 합니다.",
        path: ["correctSegment"],
      })
    }
    if (step.fixIds.length !== step.fixes.length) {
      context.addIssue({
        code: "custom",
        message: "교정안과 교정안 ID 개수는 같아야 합니다.",
        path: ["fixIds"],
      })
    }
    if (new Set(step.fixIds).size !== step.fixIds.length) {
      context.addIssue({
        code: "custom",
        message: "교정안 ID는 중복될 수 없습니다.",
        path: ["fixIds"],
      })
    }
    if (!step.fixIds.includes(step.correctFix)) {
      context.addIssue({
        code: "custom",
        message: "교정안 정답은 교정안 ID를 참조해야 합니다.",
        path: ["correctFix"],
      })
    }
  })
