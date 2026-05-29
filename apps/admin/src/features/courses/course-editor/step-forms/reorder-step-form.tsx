import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ReorderStepForm = createStepForm("REORDER", [
  { key: "instruction", label: "안내 문구" },
  { key: "items", label: "정렬 항목", type: "json" },
  { key: "explanation", label: "해설" },
  { key: "showNumberHint", label: "번호 힌트 표시", type: "boolean" },
])
