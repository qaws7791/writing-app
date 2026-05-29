import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ClassifyStepForm = createStepForm("CLASSIFY", [
  { key: "instruction", label: "안내 문구" },
  { key: "categories", label: "카테고리", type: "json" },
  { key: "items", label: "분류 항목", type: "json" },
  { key: "globalExplanation", label: "전체 해설" },
])
