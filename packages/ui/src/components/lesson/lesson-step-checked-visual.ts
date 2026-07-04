export type LessonStepCheckedVisual =
  | false
  | "correct"
  | "wrong"
  | {
      readonly explanation?: string
      readonly missed: readonly number[]
      readonly wrong: readonly number[]
    }
