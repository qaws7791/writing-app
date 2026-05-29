import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const ExampleRevealStepForm = createStepForm("EXAMPLE_REVEAL", [
  { key: "instruction", label: "안내 문구" },
  { key: "bad", label: "개선 전 예시", type: "json" },
  { key: "good", label: "개선 후 예시", type: "json" },
  { key: "analysis", label: "분석" },
  { key: "revealTrigger", label: "공개 방식" },
])
