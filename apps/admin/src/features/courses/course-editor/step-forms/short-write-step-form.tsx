import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ShortWriteStepForm = createStepForm("SHORT_WRITE", [
  { key: "instruction", label: "안내 문구" },
  { key: "prompt", label: "작성 프롬프트" },
  { key: "sourceText", label: "참고 문장" },
  { key: "minChars", label: "최소 글자 수", type: "number" },
  { key: "maxChars", label: "최대 글자 수", type: "number" },
  { key: "referenceAnswer", label: "참조 답안" },
  { key: "aiEvaluationEnabled", label: "AI 평가 사용", type: "boolean" },
  {
    key: "showReferenceAfterSubmit",
    label: "제출 후 참조 답안 표시",
    type: "boolean",
  },
])
