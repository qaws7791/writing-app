import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const MultipleChoiceStepForm = createStepForm("MULTIPLE_CHOICE", [
  { key: "question", label: "질문" },
  { key: "choices", label: "선택지", type: "array" },
  { key: "explanation", label: "해설" },
])
