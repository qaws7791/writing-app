export type LessonUserAction = "complete" | "open" | "start"

export function getLessonUserMessage(
  action: LessonUserAction,
  code: string
): string {
  if (
    code === "CURRICULUM_VERSION_CHANGED" ||
    code === "STEP_SEQUENCE_CONFLICT"
  ) {
    return "레슨 내용이 바뀌었어요. 코스에서 다시 열어 주세요."
  }

  switch (action) {
    case "open":
      if (code === "LESSON_LOCKED") {
        return "아직 시작할 수 없는 레슨이에요. 코스에서 다음 레슨을 확인해 주세요."
      }
      return code === "LESSON_NOT_FOUND"
        ? "코스에서 레슨을 다시 선택해 주세요."
        : "잠시 후 다시 열어 주세요."
    case "start":
      return "잠시 후 다시 시도해 주세요."
    case "complete":
      return "작성한 내용은 그대로 있어요. 잠시 후 다시 시도해 주세요."
  }
}
