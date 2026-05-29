import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const FillBlankStepForm = createStepForm("FILL_BLANK", [
  { key: "instruction", label: "안내 문구" },
  { key: "template", label: "문장 템플릿" },
  { key: "blanks", label: "빈칸", type: "json" },
  { key: "wordBank", label: "단어 은행", type: "string-array" },
  { key: "explanation", label: "해설" },
  { key: "caseSensitive", label: "대소문자 구분", type: "boolean" },
])
