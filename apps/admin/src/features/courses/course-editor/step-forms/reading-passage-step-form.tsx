import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ReadingPassageStepForm = createStepForm("READING_PASSAGE", [
  { key: "title", label: "지문 제목" },
  { key: "body", label: "본문" },
  { key: "source", label: "출처" },
])
