import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const IntroStepForm = createStepForm("INTRO", [
  { key: "objectives", label: "학습 목표", type: "array" },
  { key: "body", label: "도입 문구" },
  { key: "estimatedMinutes", label: "예상 시간", type: "number" },
])
