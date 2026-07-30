import type { AdminCourseDetail } from "@/features/course-editor/model/admin-course-editor"

type EditorTab = "curriculum" | "info"
type EditorUnit = AdminCourseDetail["units"][number]
type EditorLesson = EditorUnit["lessons"][number]

export type ConfirmationIntent =
  | { readonly type: "change-tab"; readonly tab: EditorTab }
  | { readonly type: "navigate-course-list" }
  | { readonly type: "publish" }
  | {
      readonly type: "remove-lesson"
      readonly lessonId: EditorLesson["id"]
      readonly lessonTitle: string
      readonly unitId: EditorUnit["id"]
    }
  | {
      readonly type: "remove-unit"
      readonly unitId: EditorUnit["id"]
      readonly unitTitle: string
    }

export function getConfirmationCopy(intent: ConfirmationIntent | null): {
  readonly action: string
  readonly description: string
  readonly destructive: boolean
  readonly title: string
} | null {
  if (intent === null) return null

  switch (intent.type) {
    case "change-tab":
      return {
        action: "이동하기",
        description: "저장하지 않은 변경은 현재 초안에 남아 있습니다.",
        destructive: false,
        title: "편집 화면을 이동할까요?",
      }
    case "navigate-course-list":
      return {
        action: "목록으로 이동",
        description: "저장하지 않은 변경을 버리고 콘텐츠 관리로 이동합니다.",
        destructive: false,
        title: "콘텐츠 관리로 이동할까요?",
      }
    case "publish":
      return {
        action: "발행하기",
        description: "현재 초안을 학습자에게 공개합니다.",
        destructive: false,
        title: "현재 초안을 발행할까요?",
      }
    case "remove-lesson":
      return {
        action: "레슨 삭제",
        description: `${intent.lessonTitle} 레슨과 포함된 스텝을 삭제합니다.`,
        destructive: true,
        title: "레슨을 삭제할까요?",
      }
    case "remove-unit":
      return {
        action: "유닛 삭제",
        description: `${intent.unitTitle} 유닛과 포함된 레슨을 삭제합니다.`,
        destructive: true,
        title: "유닛을 삭제할까요?",
      }
  }
}
