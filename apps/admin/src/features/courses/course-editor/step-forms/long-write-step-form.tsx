import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const LongWriteStepForm = createStepForm("LONG_WRITE", [
  { key: "instruction", label: "안내 문구" },
  { key: "topic", label: "작성 주제" },
  { key: "context", label: "맥락" },
  { key: "structureGuide", label: "구성 가이드", type: "string-array" },
  { key: "minChars", label: "최소 글자 수", type: "number" },
  { key: "targetChars", label: "목표 글자 수", type: "number" },
  { key: "maxChars", label: "최대 글자 수", type: "number" },
  { key: "evaluationCriteria", label: "평가 기준" },
  { key: "draftSaveEnabled", label: "임시 저장 사용", type: "boolean" },
])
