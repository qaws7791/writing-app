import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ShortWriteStepForm = createStepForm("SHORT_WRITE", [
  { key: "prompt", label: "작성 프롬프트" },
  { key: "minLength", label: "최소 글자 수", type: "number" },
  { key: "referenceAnswer", label: "참조 답안" },
])
