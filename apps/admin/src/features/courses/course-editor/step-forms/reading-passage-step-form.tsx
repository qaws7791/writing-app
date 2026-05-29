import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ReadingPassageStepForm = createStepForm("READING_PASSAGE", [
  { key: "instruction", label: "안내 문구" },
  { key: "title", label: "지문 제목" },
  { key: "text", label: "본문" },
  { key: "source", label: "출처" },
  { key: "estimatedReadMinutes", label: "예상 읽기 시간", type: "number" },
  { key: "highlightEnabled", label: "하이라이트 사용", type: "boolean" },
  { key: "focusQuestion", label: "집중 질문" },
])
