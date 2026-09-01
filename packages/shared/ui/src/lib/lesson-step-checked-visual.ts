export type LessonStepCheckedVisual =
  | false
  | "correct"
  | "wrong"
  | {
      readonly missed: readonly number[]
      readonly wrong: readonly number[]
    }
