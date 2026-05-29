import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const RevisionStepForm = createStepForm("REVISION", [
  { key: "instruction", label: "퇴고 지시" },
  { key: "revisionTask", label: "퇴고 과제" },
  { key: "originalText", label: "원문" },
  { key: "hints", label: "힌트", type: "string-array" },
  { key: "referenceRevision", label: "참조 퇴고안" },
  { key: "evaluationCriteria", label: "평가 기준" },
  { key: "aiEvaluationEnabled", label: "AI 평가 사용", type: "boolean" },
])
