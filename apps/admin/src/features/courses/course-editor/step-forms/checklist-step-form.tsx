import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ChecklistStepForm = createStepForm("CHECKLIST", [
  { key: "items", label: "체크 항목", type: "array" },
  { key: "completionGuide", label: "완료 안내" },
])
