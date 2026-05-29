import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const MultipleChoiceStepForm = createStepForm("MULTIPLE_CHOICE", [
  { key: "context", label: "맥락" },
  { key: "question", label: "질문" },
  { key: "options", label: "선택지", type: "json" },
  { key: "explanation", label: "해설" },
  { key: "shuffleOptions", label: "선택지 섞기", type: "boolean" },
])
