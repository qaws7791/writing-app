import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const RevisionStepForm = createStepForm("REVISION", [
  { key: "sourceStepId", label: "원본 스텝" },
  { key: "instruction", label: "퇴고 지시" },
  { key: "criteria", label: "체크 기준", type: "array" },
])
