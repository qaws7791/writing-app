import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const WordSelectStepForm = createStepForm("WORD_SELECT", [
  { key: "instruction", label: "안내 문구" },
  { key: "markedText", label: "표시 문장" },
  { key: "spanExplanations", label: "구간 해설", type: "json" },
  { key: "globalExplanation", label: "전체 해설" },
])
