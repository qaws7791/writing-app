import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ClassifyStepForm = createStepForm("CLASSIFY", [
  { key: "categories", label: "카테고리", type: "array" },
  { key: "items", label: "분류 항목", type: "array" },
  { key: "explanation", label: "해설" },
])
