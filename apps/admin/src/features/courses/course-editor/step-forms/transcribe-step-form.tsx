import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const TranscribeStepForm = createStepForm("TRANSCRIBE", [
  { key: "instruction", label: "입력 안내" },
  { key: "sourceText", label: "따라 쓸 문장" },
  { key: "source", label: "출처" },
  { key: "showMatchRate", label: "일치율 표시", type: "boolean" },
  { key: "caseSensitive", label: "대소문자 구분", type: "boolean" },
  { key: "punctuationSensitive", label: "문장부호 구분", type: "boolean" },
  { key: "focusNote", label: "집중 안내" },
])
