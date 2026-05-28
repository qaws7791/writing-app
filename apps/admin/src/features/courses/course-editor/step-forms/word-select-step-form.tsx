import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const WordSelectStepForm = createStepForm("WORD_SELECT", [
  { key: "sentence", label: "문장" },
  { key: "ranges", label: "선택 구간", type: "array" },
  { key: "explanation", label: "해설" },
])
