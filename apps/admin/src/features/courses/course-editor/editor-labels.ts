import type {
  AdminCurriculumVersionSummaryDto,
  AdminEditorStepType,
} from "@workspace/core/admin"

import type { EditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import type { CourseEditorView } from "@/features/courses/course-editor/editor-url-state"

type NodeStatus = "active" | "archived" | "deprecated"

const nodeStatusLabels = {
  active: "활성",
  archived: "보관됨",
  deprecated: "사용 중단",
} satisfies Record<NodeStatus, string>

const versionStatusLabels = {
  draft: "초안",
  published: "발행됨",
  archived: "보관됨",
} satisfies Record<AdminCurriculumVersionSummaryDto["status"], string>

const changeKindLabels = {
  "minor-edit": "문구 수정",
  additive: "콘텐츠 추가",
  structural: "구조 변경",
  "major-revision": "대규모 개정",
} satisfies Record<EditorChangeKind, string>

const editorViewLabels = {
  lesson: "레슨",
  step: "스텝",
  preview: "미리보기",
} satisfies Record<CourseEditorView, string>

const stepTypeLabels = {
  INTRO: "도입",
  CONCEPT: "개념",
  READING_PASSAGE: "읽기 지문",
  EXAMPLE_REVEAL: "예시 공개",
  COMPARE: "비교",
  MULTIPLE_CHOICE: "객관식",
  FILL_BLANK: "빈칸 채우기",
  WORD_SELECT: "단어 선택",
  REORDER: "순서 배열",
  MATCH: "짝 맞추기",
  CLASSIFY: "분류",
  SHORT_WRITE: "짧은 글쓰기",
  LONG_WRITE: "긴 글쓰기",
  AI_FEEDBACK: "AI 피드백",
  REVISION: "퇴고",
  CHECKLIST: "체크리스트",
  REFLECTION: "성찰",
  SUMMARY: "정리",
  TRANSCRIBE: "따라 쓰기",
  COMPLETE: "완료",
} satisfies Record<AdminEditorStepType, string>

export function getNodeStatusLabel(status: NodeStatus) {
  return nodeStatusLabels[status]
}

export function getVersionStatusLabel(
  status: AdminCurriculumVersionSummaryDto["status"]
) {
  return versionStatusLabels[status]
}

export function getChangeKindLabel(changeKind: EditorChangeKind) {
  return changeKindLabels[changeKind]
}

export function getEditorViewLabel(view: CourseEditorView) {
  return editorViewLabels[view]
}

export function getStepTypeLabel(type: AdminEditorStepType) {
  return stepTypeLabels[type]
}

export function getStepDisplayTitle(step: {
  title: string
  type: AdminEditorStepType
}) {
  const trimmedTitle = step.title.trim()

  if (
    trimmedTitle.length === 0 ||
    trimmedTitle === step.type ||
    isStepTypeValue(trimmedTitle)
  ) {
    return getStepTypeLabel(step.type)
  }

  return step.title
}

export function formatPointLabel(points: number) {
  return `${points}점`
}

function isStepTypeValue(value: string): value is AdminEditorStepType {
  return value in stepTypeLabels
}
