import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const CompleteStepForm = createStepForm("COMPLETE", [
  { key: "title", label: "완료 제목" },
  { key: "nextAction", label: "다음 행동 안내" },
])
