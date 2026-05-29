import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ReflectionStepForm = createStepForm("REFLECTION", [
  { key: "question", label: "성찰 질문" },
  { key: "context", label: "맥락" },
  { key: "promptStarters", label: "시작 문장", type: "string-array" },
  { key: "minChars", label: "최소 글자 수", type: "number" },
  { key: "saveToJournal", label: "저널에 저장", type: "boolean" },
  { key: "category", label: "분류" },
  { key: "isSkippable", label: "건너뛰기 허용", type: "boolean" },
])
