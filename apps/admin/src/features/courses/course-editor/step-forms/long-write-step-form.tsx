import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const LongWriteStepForm = createStepForm("LONG_WRITE", [
  { key: "prompt", label: "작성 프롬프트" },
  { key: "minLength", label: "최소 글자 수", type: "number" },
  { key: "maxLength", label: "최대 글자 수", type: "number" },
])
