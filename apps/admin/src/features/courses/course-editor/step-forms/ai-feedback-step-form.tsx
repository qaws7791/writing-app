import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const AiFeedbackStepForm = createStepForm("AI_FEEDBACK", [
  { key: "sourceStepId", label: "원본 스텝", type: "step-select" },
  { key: "feedbackPrompt", label: "피드백 프롬프트" },
  { key: "focusAreas", label: "평가 초점", type: "string-array" },
  { key: "showScore", label: "점수 표시", type: "boolean" },
  { key: "scoreRange", label: "점수 범위", type: "json" },
  { key: "allowRevision", label: "퇴고 허용", type: "boolean" },
  { key: "maxRevisions", label: "최대 퇴고 횟수", type: "number" },
])
