import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const TranscribeStepForm = createStepForm("TRANSCRIBE", [
  { key: "target", label: "전사 대상" },
  { key: "guide", label: "입력 안내" },
])
