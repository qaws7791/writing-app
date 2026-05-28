import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ExampleRevealStepForm = createStepForm("EXAMPLE_REVEAL", [
  { key: "initialExample", label: "초기 예시" },
  { key: "revealedExample", label: "공개 예시" },
  { key: "analysis", label: "분석" },
])
