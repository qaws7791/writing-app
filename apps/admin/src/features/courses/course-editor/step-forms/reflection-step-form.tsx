import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ReflectionStepForm = createStepForm("REFLECTION", [
  { key: "questions", label: "성찰 질문", type: "array" },
  { key: "hint", label: "힌트" },
])
