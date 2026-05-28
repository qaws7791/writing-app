import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ReorderStepForm = createStepForm("REORDER", [
  { key: "items", label: "정렬 항목", type: "array" },
  { key: "answerOrder", label: "정답 순서", type: "array" },
  { key: "explanation", label: "해설" },
])
