import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const CompareStepForm = createStepForm("COMPARE", [
  { key: "instruction", label: "안내 문구" },
  { key: "versions", label: "비교 버전", type: "json" },
  { key: "analysis", label: "분석" },
  { key: "discussionQuestion", label: "생각 질문" },
])
