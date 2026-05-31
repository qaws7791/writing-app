import type {
  AdminCurriculumNodeStatus,
  AdminEditorStepType,
} from "@workspace/core/admin"

import type { EditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import type { CourseEditorView } from "@/features/courses/course-editor/editor-url-state"
import {
  getStepTypeLabel as getStepDefinitionLabel,
  isStepTypeValue,
} from "@/features/courses/course-editor/step-definitions"

const nodeStatusLabels: Record<AdminCurriculumNodeStatus, string> = {
  active: "활성",
  archived: "보관됨",
  deprecated: "사용 중단",
}

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

export function getNodeStatusLabel(status: AdminCurriculumNodeStatus) {
  return nodeStatusLabels[status]
}

export function getChangeKindLabel(changeKind: EditorChangeKind) {
  return changeKindLabels[changeKind]
}

export function getEditorViewLabel(view: CourseEditorView) {
  return editorViewLabels[view]
}

export function getStepTypeLabel(type: AdminEditorStepType) {
  return getStepDefinitionLabel(type)
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
