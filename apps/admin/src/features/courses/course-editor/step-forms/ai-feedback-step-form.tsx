import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const AiFeedbackStepForm = createStepForm("AI_FEEDBACK", [
  { key: "sourceStepId", label: "원본 스텝" },
  { key: "focus", label: "평가 초점" },
  { key: "prompt", label: "피드백 프롬프트" },
])
