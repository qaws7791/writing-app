import type { WritingContent } from "@workspace/core"
import type { Operation } from "./types"

/**
 * Tiptap 에디터의 내용 변경을 Operation으로 변환한다.
 * ProseMirror의 세밀한 Step을 추적하는 대신
 * 전체 content를 하나의 setContent Operation으로 캡처한다.
 * 이는 단일 사용자 환경에서 충분하며 구현 복잡도를 크게 줄인다.
 */
export function captureContentChange(newContent: WritingContent): Operation[] {
  return [
    {
      type: "setContent",
      content: newContent,
    },
  ]
}

export function captureTitleChange(newTitle: string): Operation[] {
  return [
    {
      type: "setTitle",
      title: newTitle,
    },
  ]
}

export function captureFullSnapshot(
  title: string,
  content: WritingContent
): Operation[] {
  const ops: Operation[] = []

  ops.push({ type: "setTitle", title })
  ops.push({ type: "setContent", content })

  return ops
}
