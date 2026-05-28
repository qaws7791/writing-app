import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const MatchStepForm = createStepForm("MATCH", [
  { key: "leftItems", label: "왼쪽 항목", type: "array" },
  { key: "rightItems", label: "오른쪽 항목", type: "array" },
  { key: "explanation", label: "해설" },
])
