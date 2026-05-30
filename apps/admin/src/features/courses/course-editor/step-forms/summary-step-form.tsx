import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const SummaryStepForm = createStepForm("SUMMARY", [
  { key: "points", label: "핵심 포인트", type: "json" },
  { key: "nextLesson", label: "다음 레슨", type: "json" },
])
