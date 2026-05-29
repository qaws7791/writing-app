import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ChecklistStepForm = createStepForm("CHECKLIST", [
  { key: "instruction", label: "안내 문구" },
  { key: "items", label: "체크 항목", type: "json" },
  { key: "completionMode", label: "완료 방식" },
  { key: "minimumChecks", label: "최소 체크 수", type: "number" },
  { key: "saveResponses", label: "응답 저장", type: "boolean" },
])
