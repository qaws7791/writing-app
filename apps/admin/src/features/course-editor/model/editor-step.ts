import type { LessonStepType } from "@workspace/contracts/content/steps"

import type { AdminCourseDetail } from "@/features/course-editor/model/admin-course-editor"

export type EditorStep =
  AdminCourseDetail["units"][number]["lessons"][number]["steps"][number]
type LessonStepId = EditorStep["id"]

type EditorStepCreation =
  | Readonly<{
      id: LessonStepId
      sortOrder: number
      targetStepId: LessonStepId
      type: "AI_FEEDBACK"
    }>
  | Readonly<{
      id: LessonStepId
      sortOrder: number
      type: Exclude<LessonStepType, "AI_FEEDBACK">
    }>

export function createEditorStep(input: EditorStepCreation): EditorStep {
  const base = {
    id: input.id,
    sortOrder: input.sortOrder,
    status: "active" as const,
  }
  const itemId = (kind: string, index: number) => `${input.id}-${kind}-${index}`

  switch (input.type) {
    case "AI_FEEDBACK":
      return {
        ...base,
        allowRetry: true,
        feedback: "",
        focus: "",
        target: input.targetStepId,
        type: input.type,
      }
    case "CATEGORIZE": {
      const categoryId = itemId("category", 1)
      return {
        ...base,
        categories: [{ id: categoryId, label: "새 카테고리" }],
        explanation: "",
        guide: "",
        items: [
          {
            categoryId,
            id: itemId("item", 1),
            text: "새 항목",
          },
        ],
        title: "새 분류",
        type: input.type,
      }
    }
    case "COMPARE":
      return {
        ...base,
        analysis: "",
        title: "새 비교",
        type: input.type,
        versions: [
          { label: "초안", text: "" },
          { label: "수정본", text: "" },
        ],
      }
    case "FILL_BLANK": {
      const wordId = itemId("word", 1)
      return {
        ...base,
        answer: [wordId],
        explanation: "",
        template: "문장을 입력하세요.",
        type: input.type,
        wordIds: [wordId],
        words: ["단어"],
      }
    }
    case "MATCH":
      return {
        ...base,
        explanation: "",
        guide: "",
        pairs: [
          {
            left: "왼쪽 항목",
            leftId: itemId("left", 1),
            right: "오른쪽 항목",
            rightId: itemId("right", 1),
          },
        ],
        title: "새 연결",
        type: input.type,
      }
    case "MULTIPLE_CHOICE": {
      const correctId = itemId("option", 1)
      return {
        ...base,
        correct: correctId,
        explanation: "",
        options: [
          { id: correctId, text: "선택지 1" },
          { id: itemId("option", 2), text: "선택지 2" },
        ],
        question: "질문을 입력하세요.",
        type: input.type,
      }
    }
    case "ORDER": {
      const firstId = itemId("item", 1)
      return {
        ...base,
        correct: [firstId],
        explanation: "",
        itemIds: [firstId],
        items: ["새 항목"],
        showNumbers: true,
        title: "새 순서",
        type: input.type,
      }
    }
    case "READING":
      return {
        ...base,
        body: "",
        guide: "",
        title: "새 읽기",
        type: input.type,
      }
    case "SELECT": {
      const segmentId = itemId("segment", 1)
      return {
        ...base,
        correct: [segmentId],
        explanation: "",
        layout: "inline",
        question: "질문을 입력하세요.",
        segmentIds: [segmentId],
        segments: ["새 구간"],
        type: input.type,
      }
    }
    case "WRITE":
      return {
        ...base,
        min: 0,
        prompt: "쓰기 안내를 입력하세요.",
        type: input.type,
      }
  }
}
