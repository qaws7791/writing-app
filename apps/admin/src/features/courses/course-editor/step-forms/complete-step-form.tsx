import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const CompleteStepForm = createStepForm("COMPLETE", [
  { key: "nextAction", label: "다음 행동" },
])
