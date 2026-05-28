import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const CompareStepForm = createStepForm("COMPARE", [
  { key: "items", label: "비교 항목", type: "array" },
  { key: "analysis", label: "분석" },
  { key: "question", label: "생각 질문" },
])
