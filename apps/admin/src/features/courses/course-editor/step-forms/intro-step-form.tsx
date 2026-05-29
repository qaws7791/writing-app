import { createStepForm } from "@/features/courses/course-editor/step-forms/step-form-fields"

export const IntroStepForm = createStepForm("INTRO", [
  { key: "title", label: "도입 제목" },
  { key: "category", label: "분류" },
  { key: "bullets", label: "학습 포인트", type: "string-array" },
  { key: "estimatedMinutes", label: "예상 시간", type: "number" },
  { key: "totalSteps", label: "전체 스텝 수", type: "number" },
  { key: "xpAvailable", label: "획득 가능 점수", type: "number" },
])
