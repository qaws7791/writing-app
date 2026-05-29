import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const CompleteStepForm = createStepForm("COMPLETE", [
  { key: "celebrationStyle", label: "완료 연출" },
  { key: "xpEarned", label: "획득 점수", type: "number" },
  { key: "showStreak", label: "연속 학습 표시", type: "boolean" },
  { key: "lessonStats", label: "레슨 통계", type: "json" },
  { key: "nextAction", label: "다음 행동" },
])
