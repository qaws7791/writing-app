import type { AdminEditorStepType } from "@workspace/core/admin"

export type StepDefinitionGroupId =
  | "closing"
  | "explanation"
  | "practice"
  | "writing"

export type StepDefinition = {
  defaultPoints: number
  group: StepDefinitionGroupId
  label: string
}

export const STEP_DEFINITION_GROUPS = [
  { id: "explanation", label: "도입 · 설명" },
  { id: "practice", label: "퀴즈 · 연습" },
  { id: "writing", label: "글쓰기" },
  { id: "closing", label: "마무리" },
] as const satisfies readonly {
  id: StepDefinitionGroupId
  label: string
}[]

const STEP_DEFINITIONS = {
  INTRO: {
    defaultPoints: 0,
    group: "explanation",
    label: "도입",
  },
  CONCEPT: {
    defaultPoints: 0,
    group: "explanation",
    label: "개념",
  },
  READING_PASSAGE: {
    defaultPoints: 0,
    group: "explanation",
    label: "읽기 지문",
  },
  EXAMPLE_REVEAL: {
    defaultPoints: 0,
    group: "explanation",
    label: "예시 공개",
  },
  COMPARE: {
    defaultPoints: 0,
    group: "explanation",
    label: "비교",
  },
  MULTIPLE_CHOICE: {
    defaultPoints: 0,
    group: "practice",
    label: "객관식",
  },
  FILL_BLANK: {
    defaultPoints: 0,
    group: "practice",
    label: "빈칸 채우기",
  },
  WORD_SELECT: {
    defaultPoints: 0,
    group: "practice",
    label: "단어 선택",
  },
  REORDER: {
    defaultPoints: 0,
    group: "practice",
    label: "순서 배열",
  },
  MATCH: {
    defaultPoints: 0,
    group: "practice",
    label: "짝 맞추기",
  },
  CLASSIFY: {
    defaultPoints: 0,
    group: "practice",
    label: "분류",
  },
  SHORT_WRITE: {
    defaultPoints: 0,
    group: "writing",
    label: "짧은 글쓰기",
  },
  LONG_WRITE: {
    defaultPoints: 0,
    group: "writing",
    label: "긴 글쓰기",
  },
  AI_FEEDBACK: {
    defaultPoints: 0,
    group: "writing",
    label: "AI 피드백",
  },
  REVISION: {
    defaultPoints: 0,
    group: "writing",
    label: "퇴고",
  },
  TRANSCRIBE: {
    defaultPoints: 0,
    group: "writing",
    label: "따라 쓰기",
  },
  CHECKLIST: {
    defaultPoints: 0,
    group: "closing",
    label: "체크리스트",
  },
  REFLECTION: {
    defaultPoints: 0,
    group: "closing",
    label: "성찰",
  },
  SUMMARY: {
    defaultPoints: 0,
    group: "closing",
    label: "정리",
  },
  COMPLETE: {
    defaultPoints: 0,
    group: "closing",
    label: "완료",
  },
} satisfies Record<AdminEditorStepType, StepDefinition>

export const STEP_TYPE_GROUPS = STEP_DEFINITION_GROUPS.map((group) => ({
  label: group.label,
  types: getStepTypesByGroup(group.id),
}))

export function getStepDefinition(type: AdminEditorStepType) {
  return STEP_DEFINITIONS[type]
}

export function getStepDefaultPoints(type: AdminEditorStepType) {
  return getStepDefinition(type).defaultPoints
}

export function getStepTypeLabel(type: AdminEditorStepType) {
  return getStepDefinition(type).label
}

export function isStepTypeValue(value: string): value is AdminEditorStepType {
  return value in STEP_DEFINITIONS
}

function getStepTypesByGroup(group: StepDefinitionGroupId) {
  return (Object.keys(STEP_DEFINITIONS) as AdminEditorStepType[]).filter(
    (type) => STEP_DEFINITIONS[type].group === group
  )
}
