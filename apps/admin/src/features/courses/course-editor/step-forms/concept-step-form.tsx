import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ConceptStepForm = createStepForm("CONCEPT", [
  { key: "subtitle", label: "개념 부제" },
  { key: "body", label: "본문" },
  { key: "highlight", label: "강조 영역", type: "json" },
  { key: "keyTerms", label: "핵심 용어", type: "json" },
])
