import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ConceptStepForm = createStepForm("CONCEPT", [
  { key: "title", label: "개념 제목" },
  { key: "body", label: "본문" },
  { key: "emphasis", label: "강조 설명" },
])
