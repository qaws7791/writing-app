import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const SummaryStepForm = createStepForm("SUMMARY", [
  { key: "title", label: "요약 제목" },
  { key: "keySentences", label: "핵심 문장", type: "array" },
])
