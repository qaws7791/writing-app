import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const MatchStepForm = createStepForm("MATCH", [
  { key: "instruction", label: "안내 문구" },
  { key: "pairs", label: "짝 목록", type: "json" },
  { key: "explanation", label: "해설" },
  { key: "shuffleRight", label: "오른쪽 항목 섞기", type: "boolean" },
])
