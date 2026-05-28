import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const FillBlankStepForm = createStepForm("FILL_BLANK", [
  { key: "template", label: "문장 템플릿" },
  { key: "wordBank", label: "단어 은행", type: "array" },
  { key: "explanation", label: "해설" },
])
